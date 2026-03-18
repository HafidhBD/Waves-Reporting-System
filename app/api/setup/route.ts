import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  name VARCHAR(191) NOT NULL,
  password VARCHAR(191) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','PROJECT_MANAGER','FIELD_SUPERVISOR','VIEWER') NOT NULL DEFAULT 'VIEWER',
  isActive BOOLEAN NOT NULL DEFAULT true,
  phone VARCHAR(191) NULL,
  avatar VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  lastLoginAt DATETIME(3) NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  clientName VARCHAR(191) NOT NULL,
  projectCode VARCHAR(191) NOT NULL UNIQUE,
  city VARCHAR(191) NULL,
  location VARCHAR(191) NULL,
  startDate DATETIME(3) NULL,
  endDate DATETIME(3) NULL,
  status ENUM('ACTIVE','ON_HOLD','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  description TEXT NULL,
  notes TEXT NULL,
  createdById VARCHAR(30) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX projects_createdById_idx (createdById),
  CONSTRAINT projects_createdById_fkey FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_project_access (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  userId VARCHAR(30) NOT NULL,
  projectId VARCHAR(30) NOT NULL,
  role ENUM('SUPER_ADMIN','ADMIN','PROJECT_MANAGER','FIELD_SUPERVISOR','VIEWER') NOT NULL DEFAULT 'VIEWER',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY user_project_access_userId_projectId_key (userId, projectId),
  CONSTRAINT upa_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT upa_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_templates (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  projectId VARCHAR(30) NOT NULL,
  name VARCHAR(191) NOT NULL,
  nameEn VARCHAR(191) NULL,
  description TEXT NULL,
  type VARCHAR(191) NOT NULL DEFAULT 'custom',
  status ENUM('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  version INT NOT NULL DEFAULT 1,
  isDefault BOOLEAN NOT NULL DEFAULT false,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX ft_projectId_idx (projectId),
  CONSTRAINT ft_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_template_versions (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  formTemplateId VARCHAR(30) NOT NULL,
  version INT NOT NULL,
  snapshot JSON NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT ftv_formTemplateId_fkey FOREIGN KEY (formTemplateId) REFERENCES form_templates(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_sections (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  formTemplateId VARCHAR(30) NOT NULL,
  title VARCHAR(191) NOT NULL,
  titleEn VARCHAR(191) NULL,
  description TEXT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  isRepeatable BOOLEAN NOT NULL DEFAULT false,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT fs_formTemplateId_fkey FOREIGN KEY (formTemplateId) REFERENCES form_templates(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_fields (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  sectionId VARCHAR(30) NOT NULL,
  label VARCHAR(191) NOT NULL,
  labelEn VARCHAR(191) NULL,
  fieldType ENUM('SHORT_TEXT','LONG_TEXT','NUMBER','DATE','TIME','DATETIME','SINGLE_SELECT','MULTI_SELECT','DROPDOWN','RADIO','CHECKBOX_LIST','YES_NO','RATING','FILE_UPLOAD','IMAGE_UPLOAD','MULTIPLE_IMAGES','SIGNATURE','GPS_LOCATION','HIDDEN','CALCULATED','READONLY_INFO','SECTION_HEADER','REPEATER_GROUP','CHECKLIST_BLOCK') NOT NULL,
  isRequired BOOLEAN NOT NULL DEFAULT false,
  placeholder VARCHAR(191) NULL,
  helpText VARCHAR(191) NULL,
  defaultValue VARCHAR(191) NULL,
  validation JSON NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  settings JSON NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT ff_sectionId_fkey FOREIGN KEY (sectionId) REFERENCES form_sections(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_field_options (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  fieldId VARCHAR(30) NOT NULL,
  label VARCHAR(191) NOT NULL,
  labelEn VARCHAR(191) NULL,
  value VARCHAR(191) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  CONSTRAINT ffo_fieldId_fkey FOREIGN KEY (fieldId) REFERENCES form_fields(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_logic_rules (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  sourceFieldId VARCHAR(30) NOT NULL,
  targetFieldId VARCHAR(30) NOT NULL,
  \`condition\` VARCHAR(191) NOT NULL,
  conditionValue VARCHAR(191) NULL,
  action VARCHAR(191) NOT NULL,
  CONSTRAINT flr_sourceFieldId_fkey FOREIGN KEY (sourceFieldId) REFERENCES form_fields(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT flr_targetFieldId_fkey FOREIGN KEY (targetFieldId) REFERENCES form_fields(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  formTemplateId VARCHAR(30) NOT NULL,
  projectId VARCHAR(30) NOT NULL,
  submittedById VARCHAR(30) NOT NULL,
  status ENUM('DRAFT','SUBMITTED','REVIEWED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
  reviewNotes TEXT NULL,
  reviewedById VARCHAR(30) NULL,
  reviewedAt DATETIME(3) NULL,
  submittedAt DATETIME(3) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  CONSTRAINT sub_formTemplateId_fkey FOREIGN KEY (formTemplateId) REFERENCES form_templates(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT sub_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT sub_submittedById_fkey FOREIGN KEY (submittedById) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_answers (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  submissionId VARCHAR(30) NOT NULL,
  fieldId VARCHAR(30) NOT NULL,
  value LONGTEXT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT sa_submissionId_fkey FOREIGN KEY (submissionId) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT sa_fieldId_fkey FOREIGN KEY (fieldId) REFERENCES form_fields(id) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_files (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  submissionId VARCHAR(30) NOT NULL,
  fieldLabel VARCHAR(191) NULL,
  fileName VARCHAR(191) NOT NULL,
  fileUrl VARCHAR(191) NOT NULL,
  fileType VARCHAR(191) NOT NULL,
  fileSize INT NOT NULL,
  stage VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT sf_submissionId_fkey FOREIGN KEY (submissionId) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_locations (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  submissionId VARCHAR(30) NOT NULL UNIQUE,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  accuracy DOUBLE NULL,
  address VARCHAR(191) NULL,
  capturedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT sl_submissionId_fkey FOREIGN KEY (submissionId) REFERENCES submissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  userId VARCHAR(30) NULL,
  projectId VARCHAR(30) NULL,
  action VARCHAR(191) NOT NULL,
  entity VARCHAR(191) NOT NULL,
  entityId VARCHAR(191) NULL,
  details JSON NULL,
  ipAddress VARCHAR(191) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT al_userId_fkey FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT al_projectId_fkey FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(30) NOT NULL PRIMARY KEY,
  \`key\` VARCHAR(191) NOT NULL UNIQUE,
  value JSON NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;

export async function GET() {
  const results: string[] = [];
  
  try {
    // Step 1: Create tables using raw SQL
    results.push('بدء إنشاء الجداول...');
    const statements = CREATE_TABLES_SQL.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
        results.push(`✅ جدول ${tableName} - تم`);
      } catch (err: any) {
        const tableName = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
        results.push(`⚠️ جدول ${tableName}: ${err.message?.substring(0, 100)}`);
      }
    }

    results.push('✅ اكتملت عملية إنشاء الجداول');
    results.push('');
    results.push('الآن افتح: /api/seed لإنشاء الحسابات التجريبية');

    return NextResponse.json({ status: 'success', message: 'تم إنشاء الجداول بنجاح', results });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message, results }, { status: 500 });
  }
}
