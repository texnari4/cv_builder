/**
 * Google Apps Script backend для интерактивного резюме
 * Поддержка многопользовательского редактирования, шеринга и экспорта
 */

// ==================== КОНФИГУРАЦИЯ ====================

const CONFIG = {
  MAX_VERSIONS: 10,           // Максимум версий истории
  SHARE_FOLDER_ID: null,      // ID папки для общих резюме (оставить null для приватных)
  DEFAULT_DRIVE_FOLDER: 'Resume Editor', // Папка в Google Drive
};

// ==================== ТОЧКА ВХОДА ====================

function doGet(e) {
  // Проверяем параметр для просмотра общего резюме
  const viewId = e.parameter.view;
  const userId = Session.getActiveUser().getEmail();
  
  if (viewId && isValidShareId(viewId)) {
    // Режим просмотра общего резюме (без редактирования)
    return HtmlService.createHtmlOutputFromFile('index')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setWidth(1200)
      .setHeight(1000)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
  
  // Обычный режим редактирования (для своего резюме)
  return HtmlService.createHtmlOutputFromFile('index')
    .setWidth(1200)
    .setHeight(1000)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// ==================== СОХРАНЕНИЕ / ЗАГРУЗКА ====================

/**
 * Сохранить одну пару ключ-значение
 */
function saveData(key, value) {
  ensureEditingEnabledOrThrow();
  ensureOwnerOrThrow();
  const props = PropertiesService.getUserProperties();
  props.setProperty('resume_' + key, value);
  return true;
}

/**
 * Загрузить одно значение по ключу
 */
function loadData(key) {
  const props = PropertiesService.getUserProperties();
  return props.getProperty('resume_' + key);
}

/**
 * Загрузить все данные резюме сразу
 */
function loadAllData() {
  const props = PropertiesService.getUserProperties();
  const allProps = props.getProperties();
  const resumeData = {};
  
  for (const key in allProps) {
    if (key.startsWith('resume_')) {
      const cleanKey = key.replace('resume_', '');
      resumeData[cleanKey] = allProps[key];
    }
  }
  
  return resumeData;
}

/**
 * Сохранить всю структуру резюме
 */
function saveAllData(dataObject) {
  ensureEditingEnabledOrThrow();
  ensureOwnerOrThrow();
  const props = PropertiesService.getUserProperties();

  for (const key in dataObject) {
    props.setProperty('resume_' + key, JSON.stringify(dataObject[key]));
  }

  return true;
}

/**
 * Очистить все данные
 */
function clearAllData() {
  ensureEditingEnabledOrThrow();
  ensureOwnerOrThrow();
  const props = PropertiesService.getUserProperties();
  const allProps = props.getProperties();

  for (const key in allProps) {
    if (key.startsWith('resume_')) {
      props.deleteProperty(key);
    }
  }

  return true;
}

// ==================== ЗАГРУЗКА ФАЙЛОВ ====================

/**
 * Загрузить аватар в Google Drive
 */
function uploadAvatar(blob, filename = 'resume_avatar.jpg') {
  try {
    ensureEditingEnabledOrThrow();
    ensureOwnerOrThrow();
    // Получаем папку скрипта или создаём новую
    const scriptId = ScriptApp.getScriptId();
    let folder;
    
    try {
      folder = DriveApp.getRootFolder(); // Можно изменить на конкретную папку
    } catch (e) {
      folder = DriveApp.getAllFolders().next();
    }
    
    // Удалить старый аватар если существует
    const oldFiles = folder.getFilesByName(filename);
    while (oldFiles.hasNext()) {
      oldFiles.next().setTrashed(true);
    }
    
    // Загрузить новый
    const file = folder.createFile(blob);
    file.setName(filename);
    
    return file.getDownloadUrl();
  } catch (err) {
    Logger.log('Avatar upload error: ' + err);
    return null;
  }
}

/**
 * Получить URL загруженного аватара
 */
function getAvatarUrl() {
  try {
    const files = DriveApp.getRootFolder().getFilesByName('resume_avatar.jpg');
    if (files.hasNext()) {
      return files.next().getDownloadUrl();
    }
  } catch (e) {
    Logger.log('Get avatar error: ' + e);
  }
  return null;
}

// ==================== ЭКСПОРТ ====================

/**
 * Экспортировать всё резюме в JSON
 */
function exportToJSON() {
  const data = loadAllData();
  return JSON.stringify(data, null, 2);
}

/**
 * Экспортировать в Google Sheets
 */
function exportToGoogleSheets(title = 'Resume Backup') {
  const data = loadAllData();
  const spreadsheet = SpreadsheetApp.create(title);
  const sheet = spreadsheet.getActiveSheet();
  
  let row = 1;
  for (const key in data) {
    sheet.getRange(row, 1).setValue(key);
    sheet.getRange(row, 2).setValue(data[key]);
    row++;
  }
  
  return spreadsheet.getUrl();
}

// ==================== ЛОГИРОВАНИЕ ====================

function logDataUsage() {
  const props = PropertiesService.getUserProperties();
  const usage = props.getProperties();
  Logger.log('Current data usage:');
  Logger.log(usage);
  return usage;
}

// ==================== ВЕРСИОНИРОВАНИЕ ====================

/**
 * Сохранить версию резюме
 */
function saveVersion(versionName = null) {
  const props = PropertiesService.getUserProperties();
  const allProps = props.getProperties();
  
  const timestamp = new Date().toISOString();
  const name = versionName || 'Version ' + timestamp.slice(0, 10);
  
  const version = {
    name: name,
    timestamp: timestamp,
    data: {}
  };
  
  for (const key in allProps) {
    if (key.startsWith('resume_')) {
      version.data[key] = allProps[key];
    }
  }
  
  // Получаем историю версий
  const versions = JSON.parse(props.getProperty('version_history') || '[]');
  versions.unshift(version);
  
  // Ограничиваем количество версий
  if (versions.length > CONFIG.MAX_VERSIONS) {
    versions.pop();
  }
  
  props.setProperty('version_history', JSON.stringify(versions));
  return version;
}

/**
 * Получить историю версий
 */
function getVersionHistory() {
  const props = PropertiesService.getUserProperties();
  const versions = JSON.parse(props.getProperty('version_history') || '[]');
  return versions.map((v, idx) => ({
    id: idx,
    name: v.name,
    timestamp: v.timestamp
  }));
}

/**
 * Восстановить из версии
 */
function restoreVersion(versionIndex) {
  const props = PropertiesService.getUserProperties();
  const versions = JSON.parse(props.getProperty('version_history') || '[]');
  
  if (!versions[versionIndex]) return false;
  
  const version = versions[versionIndex];
  
  for (const key in version.data) {
    props.setProperty(key, version.data[key]);
  }
  
  return true;
}

// ==================== ШЕРИНГ И ПУБЛИЧНЫЙ ДОСТУП ====================

/**
 * Создать публичную ссылку на резюме
 */
function generateShareLink() {
  const props = PropertiesService.getUserProperties();
  const userId = Session.getActiveUser().getEmail();
  
  // Генерируем уникальный ID для резюме
  let shareId = props.getProperty('share_id');
  if (!shareId) {
    shareId = Utilities.getUuid();
    props.setProperty('share_id', shareId);
    
    // Сохраняем метаданные шеринга
    const shareData = {
      shareId: shareId,
      owner: userId,
      createdAt: new Date().toISOString(),
      isPublic: false,
      viewCount: 0
    };
    props.setProperty('share_metadata', JSON.stringify(shareData));
  }
  
  // Формируем URL (нужно получить URL скрипта)
  const scriptUrl = ScriptApp.getService().getUrl();
  const shareUrl = scriptUrl + '?view=' + shareId;
  
  return {
    shareId: shareId,
    shareUrl: shareUrl,
    qrCode: generateQRCode(shareUrl)
  };
}

/**
 * Проверить валидность share ID
 */
function isValidShareId(shareId) {
  try {
    // Получаем пользовательские свойства того, чьё резюме показываем
    // (В реальности нужно распределить резюме в общей базе)
    // Сейчас это упрощённая версия - проверяет свой share_id
    const props = PropertiesService.getUserProperties();
    return props.getProperty('share_id') === shareId;
  } catch (e) {
    return false;
  }
}

/**
 * Генерировать QR код
 */
function generateQRCode(text) {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

/**
 * Получить метаданные шеринга
 */
function getShareMetadata() {
  const props = PropertiesService.getUserProperties();
  const meta = props.getProperty('share_metadata');
  return meta ? JSON.parse(meta) : null;
}

/**
 * Обновить видимость шеринга
 */
function setSharePublic(isPublic) {
  const props = PropertiesService.getUserProperties();
  const meta = JSON.parse(props.getProperty('share_metadata') || '{}');
  meta.isPublic = isPublic;
  props.setProperty('share_metadata', JSON.stringify(meta));
  return meta;
}

// ==================== ЭКСПОРТ ====================

/**
 * Экспортировать в PDF
 */
function exportToPDF() {
  const data = loadAllData();
  const html = buildHTMLFromData(data);
  
  // Конвертируем HTML в PDF
  const blob = Utilities.newBlob(html, 'text/html', 'resume.html');
  
  try {
    const pdfBlob = blob.getAs('application/pdf');
    
    // Сохраняем в Drive
    const folder = getOrCreateFolder(CONFIG.DEFAULT_DRIVE_FOLDER);
    const pdfFile = folder.createFile(pdfBlob);
    pdfFile.setName('Resume_' + new Date().toISOString().slice(0, 10) + '.pdf');
    
    return {
      success: true,
      url: pdfFile.getDownloadUrl(),
      fileName: pdfFile.getName()
    };
  } catch (e) {
    Logger.log('PDF export error: ' + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Экспортировать в HTML
 */
function exportToHTML() {
  const data = loadAllData();
  const html = buildHTMLFromData(data);
  
  try {
    const blob = Utilities.newBlob(html, 'text/html', 'resume.html');
    const folder = getOrCreateFolder(CONFIG.DEFAULT_DRIVE_FOLDER);
    const file = folder.createFile(blob);
    file.setName('Resume_' + new Date().toISOString().slice(0, 10) + '.html');
    
    return {
      success: true,
      url: file.getDownloadUrl(),
      fileName: file.getName(),
      html: html // Для скачивания напрямую
    };
  } catch (e) {
    Logger.log('HTML export error: ' + e);
    return { success: false, error: e.toString() };
  }
}

/**
 * Построить HTML из данных
 */
function buildHTMLFromData(data) {
  // Это упрощённая версия - в реальности нужно вставить полный HTML с CSS
  const name = data.name || 'Resume';
  const role = data.role || '';
  const summary = data.summary || '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${name} - Resume</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; margin-bottom: 5px; }
        h2 { color: #666; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .role { color: #666; font-size: 14px; }
        .summary { margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>${name}</h1>
      <p class="role">${role}</p>
      <div class="summary">${summary}</div>
      <p style="font-size: 12px; color: #999; margin-top: 40px;">
        Создано через Resume Editor
      </p>
    </body>
    </html>
  `;
}

/**
 * Экспортировать в JSON для импорта
 */
function exportToJSON() {
  const data = loadAllData();
  return JSON.stringify(data, null, 2);
}

/**
 * Импортировать из JSON
 */
function importFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    saveAllData(data);
    return { success: true, count: Object.keys(data).length };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ==================== УТИЛИТЫ ====================

/**
 * Получить или создать папку в Google Drive
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.getRootFolder().createFolder(folderName);
}

/**
 * Получить текущего пользователя
 */
function getCurrentUser() {
  return {
    email: Session.getActiveUser().getEmail(),
    name: Session.getActiveUser().getFirstName() + ' ' + Session.getActiveUser().getLastName()
  };
}

// ==================== OWNER / PERMISSIONS HELPERS ====================

/**
 * Получить email владельца резюме (скрипт-свойство OWNER_EMAIL).
 * Если не задано, инициализируем значением effective user (владелец скрипта).
 */
function getOwnerEmail() {
  const sp = PropertiesService.getScriptProperties();
  let owner = sp.getProperty('OWNER_EMAIL');
  if (!owner) {
    try {
      owner = Session.getEffectiveUser().getEmail();
      if (owner) sp.setProperty('OWNER_EMAIL', owner);
    } catch (e) {
      // В некоторых окружениях не доступен effectiveUser
      owner = '';
    }
  }
  return owner || '';
}

function isCurrentUserOwner() {
  const current = Session.getActiveUser().getEmail() || '';
  const owner = getOwnerEmail() || '';
  return current && owner && current === owner;
}

function getCurrentUserInfo() {
  return {
    email: Session.getActiveUser().getEmail() || '',
    isOwner: isCurrentUserOwner(),
    ownerEmail: getOwnerEmail()
  };
}

/**
 * Проверяет, разрешено ли редактирование глобально (скрипт-свойство DISABLE_EDITING).
 * Если свойство равно '1', редактирование запрещено для всех.
 */
function isEditingDisabled() {
  const sp = PropertiesService.getScriptProperties();
  const flag = sp.getProperty('DISABLE_EDITING');
  return !!flag && flag === '1';
}

function ensureEditingEnabledOrThrow() {
  if (isEditingDisabled()) {
    throw new Error('Editing is disabled by owner.');
  }
}

/**
 * Возвращает настройки приложения для клиента.
 */
function getAppSettings() {
  return {
    disableEditing: isEditingDisabled(),
    ownerEmail: getOwnerEmail(),
    currentUser: Session.getActiveUser().getEmail() || '' ,
    isOwner: isCurrentUserOwner()
  };
}

/**
 * Установить флаг DISABLE_EDITING (только владелец может менять).
 * value = true/false или '1'/'0'.
 */
function setDisableEditing(value) {
  ensureOwnerOrThrow();
  const sp = PropertiesService.getScriptProperties();
  const v = (value === true || value === '1' || value === 1) ? '1' : '0';
  sp.setProperty('DISABLE_EDITING', v);
  return { disableEditing: v === '1' };
}

function ensureOwnerOrThrow() {
  if (!isCurrentUserOwner()) {
    throw new Error('Unauthorized: only the resume owner can perform this action.');
  }
}

/**
 * Получить статистику использования
 */
function getUsageStats() {
  const props = PropertiesService.getUserProperties();
  const allProps = props.getProperties();
  
  let dataSize = 0;
  let itemCount = 0;
  
  for (const key in allProps) {
    if (key.startsWith('resume_')) {
      dataSize += JSON.stringify(allProps[key]).length;
      itemCount++;
    }
  }
  
  return {
    user: getCurrentUser(),
    dataSizeKB: Math.round(dataSize / 1024),
    itemCount: itemCount,
    versionCount: getVersionHistory().length,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Получить информацию о скрипте
 */
function getScriptInfo() {
  return {
    name: 'Resume Editor',
    version: '2.0',
    maxVersions: CONFIG.MAX_VERSIONS,
    supportEmail: 'support@example.com',
    documentation: 'https://github.com/example/resume-editor'
  };
}
