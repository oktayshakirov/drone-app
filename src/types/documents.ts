export type DefaultDocumentTypeKey =
  | "drone_registration"
  | "pilot_registration"
  | "insurance";

export type DocumentTypeKey = DefaultDocumentTypeKey | null;

export interface CustomField {
  name: string;
  value: string;
}

export interface PilotDocument {
  id: string;
  typeKey: DocumentTypeKey;
  title: string;
  imageUri?: string;
  additionalFields: CustomField[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DefaultDocumentDefinition {
  typeKey: DefaultDocumentTypeKey;
  title: string;
}
