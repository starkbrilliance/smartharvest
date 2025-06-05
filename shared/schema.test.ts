// To run these tests, install vitest: npm install --save-dev vitest
import { describe, it, expect } from 'vitest';
import { growAreas, subareas, crops, insertCropSchema } from './schema';

// Mock data for testing
const area = { id: 'area-1', name: 'Tent 1', createdAt: new Date() };
const subarea = { id: 'sub-1', growAreaId: area.id, name: 'Shelf 1', createdAt: new Date() };
const cropData = {
  name: 'Tomato',
  variety: 'Cherry',
  subareaId: subarea.id,
  plantedDate: new Date().toISOString(),
  expectedHarvestDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  status: 'growing',
  notes: 'Test crop',
  imageUrl: '',
};

describe('Schema: Grow Areas & Subareas', () => {
  it('should define a grow area', () => {
    expect(growAreas.name).toBe('grow_areas');
  });
  it('should define a subarea with a grow area relation', () => {
    expect(subareas.name).toBe('subareas');
    // Check for growAreaId column existence
    expect('growAreaId' in subareas).toBe(true);
  });
});

describe('Schema: Crops', () => {
  it('should define a crop with a subareaId', () => {
    expect(crops.name).toBe('crops');
    // Check for subareaId column existence
    expect('subareaId' in crops).toBe(true);
  });
  it('should validate crop insert schema with string dates', () => {
    const parsed = insertCropSchema.parse({
      ...cropData,
      plantedDate: cropData.plantedDate,
      expectedHarvestDate: cropData.expectedHarvestDate,
    });
    expect(parsed.name).toBe('Tomato');
    expect(parsed.subareaId).toBe(subarea.id);
    expect(parsed.plantedDate).toBeInstanceOf(Date);
    expect(parsed.expectedHarvestDate).toBeInstanceOf(Date);
  });
  it('should fail validation if subareaId is missing', () => {
    expect(() => insertCropSchema.parse({ ...cropData, subareaId: undefined })).toThrow();
  });
});
