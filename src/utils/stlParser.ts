import * as THREE from 'three';

export interface STLGeometry {
  volume: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  };
}

export class STLParser {
  static async parseFile(file: File): Promise<STLGeometry> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const geometry = this.parseSTL(arrayBuffer);
          resolve(geometry);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private static parseSTL(arrayBuffer: ArrayBuffer): STLGeometry {
    const dataView = new DataView(arrayBuffer);
    
    // Check if it's binary STL (starts with solid but has binary structure)
    const isBinary = this.isBinarySTL(arrayBuffer);
    
    if (isBinary) {
      return this.parseBinarySTL(dataView);
    } else {
      return this.parseAsciiSTL(arrayBuffer);
    }
  }

  private static isBinarySTL(arrayBuffer: ArrayBuffer): boolean {
    if (arrayBuffer.byteLength < 84) return false;
    
    const dataView = new DataView(arrayBuffer);
    const triangleCount = dataView.getUint32(80, true);
    const expectedSize = 80 + 4 + (triangleCount * 50);
    
    return Math.abs(arrayBuffer.byteLength - expectedSize) < 1000;
  }

  private static parseBinarySTL(dataView: DataView): STLGeometry {
    const triangleCount = dataView.getUint32(80, true);
    const vertices: THREE.Vector3[] = [];
    
    let offset = 84; // Skip header and triangle count
    
    for (let i = 0; i < triangleCount; i++) {
      // Skip normal vector (12 bytes)
      offset += 12;
      
      // Read 3 vertices (9 floats, 36 bytes total)
      for (let j = 0; j < 3; j++) {
        const x = dataView.getFloat32(offset, true);
        const y = dataView.getFloat32(offset + 4, true);
        const z = dataView.getFloat32(offset + 8, true);
        vertices.push(new THREE.Vector3(x, y, z));
        offset += 12;
      }
      
      // Skip attribute byte count (2 bytes)
      offset += 2;
    }
    
    return this.calculateGeometry(vertices);
  }

  private static parseAsciiSTL(arrayBuffer: ArrayBuffer): STLGeometry {
    const text = new TextDecoder().decode(arrayBuffer);
    const lines = text.split('\n');
    const vertices: THREE.Vector3[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('vertex')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 4) {
          const x = parseFloat(parts[1]);
          const y = parseFloat(parts[2]);
          const z = parseFloat(parts[3]);
          vertices.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    
    return this.calculateGeometry(vertices);
  }

  private static calculateGeometry(vertices: THREE.Vector3[]): STLGeometry {
    if (vertices.length === 0) {
      throw new Error('No vertices found in STL file');
    }

    // Calculate bounding box
    const box = new THREE.Box3();
    box.setFromPoints(vertices);
    
    const size = box.getSize(new THREE.Vector3());
    const boundingBox = {
      x: Math.abs(size.x),
      y: Math.abs(size.y),
      z: Math.abs(size.z)
    };

    // Calculate volume using mesh volume calculation
    const rawVolume = this.calculateMeshVolume(vertices);
    const volumeInCm3 = Math.abs(rawVolume) / 1000; // Convert mm³ to cm³
    
    // Apply ceiling rounding - round UP to nearest whole number
    const roundedVolume = Math.ceil(volumeInCm3);
    
    return {
      volume: roundedVolume,
      boundingBox
    };
  }

  private static calculateMeshVolume(vertices: THREE.Vector3[]): number {
    let volume = 0;
    
    // Process triangles (every 3 vertices form a triangle)
    for (let i = 0; i < vertices.length; i += 3) {
      if (i + 2 < vertices.length) {
        const v1 = vertices[i];
        const v2 = vertices[i + 1];
        const v3 = vertices[i + 2];
        
        // Calculate signed volume of tetrahedron formed by origin and triangle
        const signedVolume = v1.dot(v2.clone().cross(v3)) / 6;
        volume += signedVolume;
      }
    }
    
    return volume;
  }
}

// Fallback parser for other file types
export class FileParser {
  static async parseFile(file: File): Promise<STLGeometry> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'stl':
        return STLParser.parseFile(file);
      case 'step':
      case 'stp':
      case 'iges':
      case 'igs':
        // For now, return mock data for STEP/IGES files
        // In a real implementation, you'd need a STEP/IGES parser
        return this.getMockGeometry(file.name);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private static getMockGeometry(fileName: string): STLGeometry {
    // Generate realistic mock data based on file name
    const hash = this.simpleHash(fileName);
    const rawVolume = 10 + (hash % 100); // 10-110 cm³
    
    // Apply ceiling rounding to mock data as well
    const volume = Math.ceil(rawVolume);
    const scale = Math.sqrt(volume / 10);
    
    return {
      volume,
      boundingBox: {
        x: 20 * scale + (hash % 10),
        y: 15 * scale + ((hash * 2) % 8),
        z: 10 * scale + ((hash * 3) % 6)
      }
    };
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}