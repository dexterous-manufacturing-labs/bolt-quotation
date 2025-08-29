import { describe, it, expect, vi } from 'vitest';
import { STLParser, FileParser } from '../utils/stlParser';

// Mock File and FileReader
global.FileReader = vi.fn(() => ({
  readAsArrayBuffer: vi.fn(),
  onload: null,
  onerror: null,
  result: null
})) as any;

describe('STLParser', () => {
  it('should handle binary STL files', async () => {
    const mockArrayBuffer = new ArrayBuffer(84 + 50); // Header + 1 triangle
    const dataView = new DataView(mockArrayBuffer);
    
    // Set triangle count
    dataView.setUint32(80, 1, true);
    
    // Mock FileReader
    const mockFileReader = {
      readAsArrayBuffer: vi.fn(),
      onload: null,
      onerror: null,
      result: mockArrayBuffer
    };
    
    vi.mocked(FileReader).mockImplementation(() => mockFileReader as any);
    
    const file = new File([''], 'test.stl', { type: 'application/octet-stream' });
    
    // Simulate successful file read
    const parsePromise = STLParser.parseFile(file);
    
    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: mockArrayBuffer } } as any);
    }
    
    const result = await parsePromise;
    
    expect(result).toHaveProperty('volume');
    expect(result).toHaveProperty('boundingBox');
    expect(typeof result.volume).toBe('number');
    expect(result.boundingBox).toHaveProperty('x');
    expect(result.boundingBox).toHaveProperty('y');
    expect(result.boundingBox).toHaveProperty('z');
  });

  it('should handle file read errors', async () => {
    const mockFileReader = {
      readAsArrayBuffer: vi.fn(),
      onload: null,
      onerror: null,
      result: null
    };
    
    vi.mocked(FileReader).mockImplementation(() => mockFileReader as any);
    
    const file = new File([''], 'test.stl', { type: 'application/octet-stream' });
    
    const parsePromise = STLParser.parseFile(file);
    
    // Trigger onerror
    if (mockFileReader.onerror) {
      mockFileReader.onerror(new Error('File read error') as any);
    }
    
    await expect(parsePromise).rejects.toThrow();
  });
});

describe('FileParser', () => {
  it('should handle STL files', async () => {
    const mockGeometry = {
      volume: 10.5,
      boundingBox: { x: 20, y: 15, z: 10 }
    };
    
    // Mock STLParser.parseFile
    vi.spyOn(STLParser, 'parseFile').mockResolvedValue(mockGeometry);
    
    const file = new File([''], 'test.stl', { type: 'application/octet-stream' });
    const result = await FileParser.parseFile(file);
    
    expect(result).toEqual(mockGeometry);
    expect(STLParser.parseFile).toHaveBeenCalledWith(file);
  });

  it('should handle STEP files with mock data', async () => {
    const file = new File([''], 'test.step', { type: 'application/octet-stream' });
    const result = await FileParser.parseFile(file);
    
    expect(result).toHaveProperty('volume');
    expect(result).toHaveProperty('boundingBox');
    expect(typeof result.volume).toBe('number');
    expect(result.volume).toBeGreaterThan(0);
  });

  it('should handle IGES files with mock data', async () => {
    const file = new File([''], 'test.iges', { type: 'application/octet-stream' });
    const result = await FileParser.parseFile(file);
    
    expect(result).toHaveProperty('volume');
    expect(result).toHaveProperty('boundingBox');
    expect(typeof result.volume).toBe('number');
    expect(result.volume).toBeGreaterThan(0);
  });

  it('should throw error for unsupported file types', async () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    
    await expect(FileParser.parseFile(file)).rejects.toThrow('Unsupported file type: txt');
  });

  it('should generate consistent mock data for same filename', async () => {
    const file1 = new File([''], 'test.step', { type: 'application/octet-stream' });
    const file2 = new File([''], 'test.step', { type: 'application/octet-stream' });
    
    const result1 = await FileParser.parseFile(file1);
    const result2 = await FileParser.parseFile(file2);
    
    expect(result1).toEqual(result2);
  });
});