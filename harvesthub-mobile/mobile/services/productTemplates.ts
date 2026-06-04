import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateProductDto } from '@/types/backend';

export interface ProductTemplate {
  id: string;
  name: string;
  description?: string;
  defaultValues: Partial<CreateProductDto>;
  categoryId?: number;
  unit?: string;
  storageConditions?: string;
}

const STORAGE_KEY = 'harvesthub-mobile-product-templates';

const defaultTemplates: ProductTemplate[] = [
  {
    id: 'template-tomato',
    name: 'Помидоры',
    description: 'Свежие красные помидоры',
    defaultValues: {
      unit: 'кг',
      storageConditions: 'Хранить при температуре 10-15°C',
    },
  },
  {
    id: 'template-cucumber',
    name: 'Огурцы',
    description: 'Свежие огурцы',
    defaultValues: {
      unit: 'кг',
      storageConditions: 'Хранить при температуре 8-12°C',
    },
  },
  {
    id: 'template-potato',
    name: 'Картофель',
    description: 'Молодой картофель',
    defaultValues: {
      unit: 'кг',
      storageConditions: 'Хранить в прохладном темном месте',
    },
  },
  {
    id: 'template-carrot',
    name: 'Морковь',
    description: 'Свежая морковь',
    defaultValues: {
      unit: 'кг',
      storageConditions: 'Хранить при температуре 0-4°C',
    },
  },
  {
    id: 'template-onion',
    name: 'Лук',
    description: 'Репчатый лук',
    defaultValues: {
      unit: 'кг',
      storageConditions: 'Хранить в сухом прохладном месте',
    },
  },
];

const readTemplates = async (): Promise<ProductTemplate[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTemplates));
    return defaultTemplates;
  }

  try {
    const parsed = JSON.parse(raw) as ProductTemplate[];
    return Array.isArray(parsed) ? parsed : defaultTemplates;
  } catch {
    return defaultTemplates;
  }
};

const writeTemplates = (templates: ProductTemplate[]) =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));

export const productTemplatesService = {
  getAll: readTemplates,

  add: async (template: Omit<ProductTemplate, 'id'>) => {
    const templates = await readTemplates();
    const newTemplate: ProductTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    await writeTemplates([...templates, newTemplate]);
    return newTemplate;
  },

  remove: async (id: string) => {
    const templates = await readTemplates();
    await writeTemplates(templates.filter((t) => t.id !== id));
  },

  applyTemplate: (template: ProductTemplate): Partial<CreateProductDto> => ({
    name: template.name,
    description: template.description,
    unit: template.unit || 'кг',
    storageConditions: template.storageConditions,
    categoryId: template.categoryId,
    ...template.defaultValues,
  }),
};
