export interface SurveyFieldSchema {
  surveyId: number;
  surveyTitle: string;
  sectionId: string;
  sectionTitle: string;
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  content?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionRow {
  id: number | string;
  survey_id: number;
  survey_title: string;
  project_id?: string | null;
  enumerator_email?: string;
  enumerator_name?: string;
  is_draft?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  response_data: Record<string, any>;
}

const getFieldKeyByType = (
  catalog: SurveyFieldSchema[],
  type: string,
  surveyId?: number
): string | undefined => {
  if (surveyId !== undefined) {
    const match = catalog.find((item) => item.surveyId === surveyId && item.type === type);
    if (match) return match.name;
  }
  return catalog.find((item) => item.type === type)?.name;
};

export const getRecordImageUrl = (record: SubmissionRow, catalog: SurveyFieldSchema[]): string | undefined => {
  if (record.image_url) return record.image_url;
  const key = getFieldKeyByType(catalog, 'image', record.survey_id);
  if (!key) return undefined;
  return record.response_data?.[key];
};

const parseLocationValue = (raw: any): { latitude: number; longitude: number } | undefined => {
  if (raw == null) return undefined;
  if (typeof raw === 'object' && raw.latitude !== undefined && raw.longitude !== undefined) {
    const lat = Number(raw.latitude);
    const lng = Number(raw.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }
  if (typeof raw === 'string') {
    const parts = raw.split(',').map((part) => part.trim());
    if (parts.length >= 2) {
      const lat = Number(parts[0]);
      const lng = Number(parts[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }
  return undefined;
};

export const getRecordLocation = (
  record: SubmissionRow,
  catalog: SurveyFieldSchema[]
): { latitude: number; longitude: number } | undefined => {
  if (record.latitude !== undefined && record.longitude !== undefined) {
    return { latitude: record.latitude, longitude: record.longitude };
  }
  const key = getFieldKeyByType(catalog, 'location', record.survey_id);
  if (!key) return undefined;
  return parseLocationValue(record.response_data?.[key]);
};

export const formatLocationValue = (
  record: SubmissionRow,
  catalog: SurveyFieldSchema[]
): string => {
  const loc = getRecordLocation(record, catalog);
  if (!loc) return '—';
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
};

export const buildFieldCatalog = (forms: any[]): SurveyFieldSchema[] => {
  return forms.flatMap((form) => {
    const formConfig = form.form_config;
    if (!formConfig || !Array.isArray(formConfig.sections)) {
      return [];
    }
    return formConfig.sections.flatMap((section: any) => {
      const fields = Array.isArray(section.fields) ? section.fields : [];
      return fields.map((field: any) => ({
        surveyId: form.id,
        surveyTitle: form.title,
        sectionId: section.id,
        sectionTitle: section.title,
        id: field.id,
        name: field.name,
        label: field.label || field.name || 'Field',
        type: field.type || 'text',
        required: Boolean(field.required),
        placeholder: field.placeholder,
        hint: field.hint,
        options: Array.isArray(field.options) ? field.options : undefined,
        minValue: typeof field.minValue === 'number' ? field.minValue : undefined,
        maxValue: typeof field.maxValue === 'number' ? field.maxValue : undefined,
        content: field.content,
        metadata: field.metadata || {},
      }));
    });
  });
};

export const getFieldSchema = (
  fieldName: string,
  surveyId: number | undefined,
  catalog: SurveyFieldSchema[]
): SurveyFieldSchema | undefined => {
  if (surveyId !== undefined) {
    return catalog.find((item) => item.surveyId === surveyId && item.name === fieldName)
      || catalog.find((item) => item.name === fieldName);
  }
  return catalog.find((item) => item.name === fieldName);
};

export const getFieldLabel = (
  fieldName: string,
  surveyId: number | undefined,
  catalog: SurveyFieldSchema[]
): string => {
  return getFieldSchema(fieldName, surveyId, catalog)?.label || fieldName;
};

export const getFieldType = (
  fieldName: string,
  surveyId: number | undefined,
  catalog: SurveyFieldSchema[]
): string => {
  return getFieldSchema(fieldName, surveyId, catalog)?.type || 'text';
};

export const formatResponseValue = (value: any, type?: string): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).join(', ') || '—';
  }

  if (typeof value === 'object') {
    if (value.latitude !== undefined && value.longitude !== undefined) {
      return `${value.latitude}, ${value.longitude}`;
    }
    return JSON.stringify(value);
  }

  return String(value);
};

export const getSortedFieldKeys = (
  records: SubmissionRow[],
  catalog: SurveyFieldSchema[],
  limit: number = 8
): { key: string; label: string; type: string; count: number }[] => {
  const frequency = new Map<string, number>();
  records.forEach((record) => {
    const data = record.response_data || {};
    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value === null || value === undefined || value === '') return;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });
  });

  return Array.from(frequency.entries())
    .map(([key, count]) => ({
      key,
      count,
      label: getFieldLabel(key, undefined, catalog),
      type: getFieldType(key, undefined, catalog),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

export const getFieldValueFromRecord = (
  record: SubmissionRow,
  fieldName: string
): any => {
  return record.response_data?.[fieldName];
};

export const countFieldValues = (
  records: SubmissionRow[],
  fieldName: string
): Record<string, number> => {
  const values = new Map<string, number>();
  records.forEach((record) => {
    const raw = record.response_data?.[fieldName];
    if (raw === null || raw === undefined || raw === '') return;
    const normalized = Array.isArray(raw)
      ? raw.filter((item) => item !== null && item !== undefined).map((item) => String(item).trim()).join(', ')
      : String(raw).trim();
    if (!normalized) return;
    values.set(normalized, (values.get(normalized) || 0) + 1);
  });
  return Object.fromEntries(values.entries());
};
