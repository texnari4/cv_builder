/**
 * Online Resume Builder (Google Apps Script)
 * A4-first, LinkedIn-focused resume constructor
 * Single-file implementation with inline HTML/CSS/JS
 */

// ============================================================================
// GOOGLE APPS SCRIPT SERVER-SIDE CODE
// ============================================================================

/**
 * Главная функция - открывает веб-интерфейс
 * Используется при развертывании как Web App
 */
function doGet() {
  return HtmlService.createHtmlOutput(getHTML())
    .setWidth(1200)
    .setHeight(1400)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Экспорт резюме в PDF
 * Client вызывает эту функцию с контентом
 */
function exportToPDF(htmlContent, fileName) {
  try {
    const blob = Utilities.newBlob(htmlContent, 'text/html', fileName + '.html');
    Logger.log('PDF export initiated: ' + fileName);
    return { success: true, message: 'PDF экспортируется клиентом через html2pdf' };
  } catch (e) {
    Logger.log('Error: ' + e.toString());
    return { success: false, message: 'Ошибка экспорта' };
  }
}

/**
 * Получить HTML контент приложения
 */
function getHTML() {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Online Resume Builder</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    /* ========== ГЛОБАЛЬНЫЕ СТИЛИ ========== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f7fa;
      color: #2d3748;
    }

    /* ========== НАВБАР ========== */
    .navbar {
      background: white;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .navbar-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1a202c;
    }

    .navbar-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0066cc;
      color: white;
    }

    .btn-primary:hover {
      background: #0052a3;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #2d3748;
    }

    .btn-secondary:hover {
      background: #cbd5e0;
    }

    .toggle-buttons {
      display: flex;
      gap: 0.25rem;
      background: #e2e8f0;
      border-radius: 6px;
      padding: 0.25rem;
    }

    .toggle-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s;
      color: #718096;
    }

    .toggle-btn.active {
      background: white;
      color: #0066cc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* ========== ОСНОВНОЙ КОНТЕЙНЕР ========== */
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    /* ========== A4 СТРАНИЦА ========== */
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      display: grid;
      grid-template-columns: 1fr 1fr;
      overflow: hidden;
      font-size: 11px;
      line-height: 1.4;
    }

    /* ЛЕВАЯ КОЛОНКА (70%) */
    .column-left {
      grid-column: 1 / 2;
      padding: 1.5rem;
      border-right: 1px solid #e2e8f0;
      overflow-y: auto;
      max-height: 297mm;
    }

    /* ПРАВАЯ КОЛОНКА (30%) */
    .column-right {
      grid-column: 2 / 3;
      padding: 1.5rem;
      background: #f9fafb;
      overflow-y: auto;
      max-height: 297mm;
    }

    /* ========== HEADER ========== */
    .header {
      margin-bottom: 1.2rem;
      border-bottom: 2px solid #0066cc;
      padding-bottom: 0.8rem;
    }

    .header-name {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.2rem;
    }

    .header-role {
      font-size: 1rem;
      color: #0066cc;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .header-links {
      display: flex;
      gap: 1rem;
      font-size: 0.85rem;
    }

    .header-links a {
      color: #0066cc;
      text-decoration: none;
      cursor: pointer;
    }

    .header-links a:hover {
      text-decoration: underline;
    }

    /* ========== СЕКЦИИ ========== */
    .section {
      margin-bottom: 1.2rem;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 0.6rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      border-bottom: 1px solid #cbd5e0;
      padding-bottom: 0.3rem;
    }

    /* ========== EDITABLE FIELDS ========== */
    .edit-field {
      border: none;
      background: transparent;
      padding: 0;
      font: inherit;
      color: inherit;
      width: 100%;
      resize: none;
    }

    .edit-mode .edit-field {
      border: 1px dotted #a0aec0;
      padding: 0.3rem 0.4rem;
      background: #f7fafc;
      border-radius: 3px;
    }

    .edit-field:focus {
      outline: none;
      background: #edf2f7;
      border-color: #0066cc;
    }

    /* ========== SUMMARY ========== */
    .summary-text {
      font-size: 0.9rem;
      line-height: 1.5;
      color: #4a5568;
      text-align: justify;
    }

    .char-counter {
      font-size: 0.75rem;
      color: #a0aec0;
      margin-top: 0.3rem;
      display: none;
    }

    .edit-mode .char-counter {
      display: block;
    }

    /* ========== EXPERIENCE ========== */
    .job {
      margin-bottom: 0.8rem;
      page-break-inside: avoid;
    }

    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.3rem;
    }

    .job-company {
      font-weight: 700;
      color: #1a202c;
      font-size: 0.95rem;
    }

    .job-date {
      font-size: 0.8rem;
      color: #718096;
      font-style: italic;
    }

    .job-role {
      font-weight: 600;
      color: #2d3748;
      font-size: 0.9rem;
      margin-bottom: 0.3rem;
    }

    .job-bullets {
      margin-left: 0.8rem;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .job-bullet {
      margin-bottom: 0.2rem;
    }

    .job-bullet:before {
      content: "• ";
      color: #0066cc;
      font-weight: bold;
    }

    .edit-mode .job-bullet-input {
      display: block;
      background: #f7fafc;
      border: 1px dotted #a0aec0;
      padding: 0.2rem 0.3rem;
      border-radius: 2px;
      margin: 0.2rem 0;
      font-size: 0.85rem;
    }

    /* ========== SELECTED IMPACT ========== */
    .impact-item {
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .impact-item:before {
      content: "✓ ";
      color: #48bb78;
      font-weight: bold;
      margin-right: 0.3rem;
    }

    /* ========== SKILLS / TOOLS / LANGUAGES ========== */
    .skill-category {
      margin-bottom: 0.6rem;
    }

    .skill-label {
      font-weight: 700;
      color: #1a202c;
      font-size: 0.8rem;
      margin-bottom: 0.2rem;
    }

    .skill-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      font-size: 0.8rem;
    }

    .skill-tag {
      background: #e0e7ff;
      color: #3730a3;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }

    /* ========== EDUCATION ========== */
    .education-item {
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
    }

    .education-school {
      font-weight: 700;
      color: #1a202c;
    }

    .education-degree {
      color: #4a5568;
    }

    .education-date {
      font-size: 0.75rem;
      color: #718096;
    }

    /* ========== EDIT MODE CONTROLS ========== */
    .edit-controls {
      display: none;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .edit-mode .edit-controls {
      display: flex;
    }

    .btn-small {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
      border: 1px solid #cbd5e0;
      background: white;
      cursor: pointer;
      border-radius: 3px;
      transition: all 0.2s;
    }

    .btn-small:hover {
      background: #edf2f7;
    }

    /* ========== PRINT STYLES ========== */
    @media print {
      body {
        background: white;
      }
      .navbar, .container-controls, .edit-controls {
        display: none;
      }
      .a4-page {
        box-shadow: none;
        width: 210mm;
        height: 297mm;
        margin: 0;
      }
      .column-left, .column-right {
        max-height: none;
        overflow: visible;
      }
    }

    /* ========== MOBILE RESPONSIVE ========== */
    @media (max-width: 768px) {
      .navbar {
        padding: 0.75rem 1rem;
        flex-direction: column;
        gap: 0.5rem;
      }

      .navbar-left {
        width: 100%;
        justify-content: space-between;
      }

      .navbar-buttons {
        width: 100%;
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }

      .container {
        padding: 0.5rem;
        margin: 1rem auto;
      }

      .a4-page {
        width: 100%;
        height: auto;
        grid-template-columns: 1fr;
        box-shadow: 0 0 10px rgba(0,0,0,0.05);
      }

      .column-left, .column-right {
        grid-column: 1 / 2;
        border-right: none;
        border-bottom: 2px solid #e2e8f0;
        padding: 1.2rem;
        max-height: none;
        overflow: visible;
      }

      .column-right {
        background: white;
      }

      .header-name {
        font-size: 1.3rem;
      }

      .header-role {
        font-size: 0.9rem;
      }

      .section-title {
        font-size: 0.85rem;
      }

      .summary-text {
        font-size: 0.8rem;
      }

      .job-company {
        font-size: 0.85rem;
      }

      .toggle-buttons {
        width: 100%;
      }

      .toggle-btn {
        flex: 1;
        text-align: center;
      }
    }

    /* ========== ОЧЕНЬ МОБИЛЬНЫЙ (< 480px) ========== */
    @media (max-width: 480px) {
      .navbar {
        padding: 0.5rem 0.75rem;
      }

      .btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
      }

      .section {
        margin-bottom: 0.8rem;
      }

      .header-name {
        font-size: 1.1rem;
      }

      .section-title {
        font-size: 0.75rem;
      }

      .summary-text {
        font-size: 0.75rem;
      }
    }

    /* ========== СКРЫТИЕ ЭЛЕМЕНТОВ В EDIT MODE ========== */
    .view-mode .edit-element {
      display: none;
    }

    .edit-mode .view-element {
      display: none;
    }
  </style>
</head>
<body>
  <!-- НАВБАР -->
  <nav class="navbar">
    <div class="navbar-left">
      <div class="navbar-title">📄 Resume Builder</div>
    </div>
    <div class="navbar-buttons">
      <div class="toggle-buttons">
        <button class="toggle-btn active" id="viewBtn" onclick="setMode('view')">👁️ View</button>
        <button class="toggle-btn" id="editBtn" onclick="setMode('edit')">✏️ Edit</button>
      </div>
      <button class="btn btn-primary edit-element" onclick="exportPDF()">📥 PDF Export</button>
      <button class="btn btn-secondary edit-element" onclick="exportJSON()">💾 Export JSON</button>
      <button class="btn btn-secondary edit-element" onclick="importJSON()">📤 Import JSON</button>
    </div>
  </nav>

  <!-- ГЛАВНЫЙ КОНТЕЙНЕР -->
  <div class="container">
    <!-- A4 СТРАНИЦА -->
    <div class="a4-page" id="resumePage">
      <!-- ЛЕВАЯ КОЛОНКА (70%) -->
      <div class="column-left">
        <!-- HEADER -->
        <div class="header">
          <div class="header-name" id="displayName" ondblclick="editField('displayName', 'text')">
            <span class="view-element">Иван Петров</span>
            <input type="text" class="edit-field edit-element" value="Иван Петров" id="inputName" onchange="updateDisplay('displayName', 'inputName', 'text')">
          </div>
          <div class="header-role" id="displayRole" ondblclick="editField('displayRole', 'text')">
            <span class="view-element">Senior DevOps Engineer</span>
            <input type="text" class="edit-field edit-element" value="Senior DevOps Engineer" id="inputRole" onchange="updateDisplay('displayRole', 'inputRole', 'text')">
          </div>
          <div class="header-links">
            <a href="https://linkedin.com/in/ivan-petrov" target="_blank" onclick="event.stopPropagation()" id="linkedinLink">
              <span class="view-element">LinkedIn</span>
              <span class="edit-element">🔗 LinkedIn</span>
            </a>
            <a href="https://github.com/ivan-petrov" target="_blank" onclick="event.stopPropagation()" id="githubLink">
              <span class="view-element">GitHub</span>
              <span class="edit-element">🔗 GitHub</span>
            </a>
          </div>
        </div>

        <!-- SUMMARY -->
        <div class="section">
          <div class="section-title">Summary</div>
          <div class="summary-text" id="displaySummary" ondblclick="editField('displaySummary', 'textarea')">
            <span class="view-element">Senior DevOps Engineer с 8+ лет опыта в проектировании и управлении инфраструктурой высоконагруженных систем. Специализация: Kubernetes, AWS, Infrastructure as Code, CI/CD pipelines и оптимизация облачных стоимостей. Успешно масштабировал системы для обработки 10M+ запросов в день. Лидер в автоматизации и культуре DevOps. Ментор команд по best practices облачных технологий.</span>
            <textarea class="edit-field edit-element" id="inputSummary" onchange="updateDisplay('displaySummary', 'inputSummary', 'textarea'); updateCharCount()">Senior DevOps Engineer с 8+ лет опыта в проектировании и управлении инфраструктурой высоконагруженных систем. Специализация: Kubernetes, AWS, Infrastructure as Code, CI/CD pipelines и оптимизация облачных стоимостей. Успешно масштабировал системы для обработки 10M+ запросов в день. Лидер в автоматизации и культуре DevOps. Ментор команд по best practices облачных технологий.</textarea>
          </div>
          <div class="char-counter"><span id="charCount">0</span>/150 characters</div>
        </div>

        <!-- EXPERIENCE -->
        <div class="section">
          <div class="section-title">Experience</div>
          <div id="jobsList">
            <!-- Jobs будут добавлены скриптом -->
          </div>
          <div class="edit-controls edit-element">
            <button class="btn-small" onclick="addJob()">+ Add Job</button>
          </div>
        </div>

        <!-- SELECTED IMPACT -->
        <div class="section">
          <div class="section-title">Selected Impact</div>
          <div id="impactList">
            <!-- Impact items будут добавлены скриптом -->
          </div>
          <div class="edit-controls edit-element">
            <button class="btn-small" onclick="addImpact()">+ Add Impact</button>
          </div>
        </div>
      </div>

      <!-- ПРАВАЯ КОЛОНКА (30%) -->
      <div class="column-right">
        <!-- SKILLS -->
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skill-category">
            <div class="skill-label">Languages</div>
            <div class="skill-items" id="skillsLanguages">
              <span class="skill-tag view-element">Python</span>
              <span class="skill-tag view-element">Bash</span>
              <span class="skill-tag view-element">Go</span>
              <input type="text" class="edit-field edit-element" value="Python, Bash, Go" id="inputSkillsLanguages" onchange="updateSkills('inputSkillsLanguages', 'skillsLanguages')">
            </div>
          </div>
          <div class="skill-category">
            <div class="skill-label">Frameworks</div>
            <div class="skill-items" id="skillsFrameworks">
              <span class="skill-tag view-element">Docker</span>
              <span class="skill-tag view-element">Kubernetes</span>
              <span class="skill-tag view-element">Terraform</span>
              <input type="text" class="edit-field edit-element" value="Docker, Kubernetes, Terraform" id="inputSkillsFrameworks" onchange="updateSkills('inputSkillsFrameworks', 'skillsFrameworks')">
            </div>
          </div>
          <div class="skill-category">
            <div class="skill-label">Approaches</div>
            <div class="skill-items" id="skillsApproaches">
              <span class="skill-tag view-element">IaC</span>
              <span class="skill-tag view-element">Microservices</span>
              <span class="skill-tag view-element">GitOps</span>
              <input type="text" class="edit-field edit-element" value="IaC, Microservices, GitOps" id="inputSkillsApproaches" onchange="updateSkills('inputSkillsApproaches', 'skillsApproaches')">
            </div>
          </div>
        </div>

        <!-- TOOLS -->
        <div class="section">
          <div class="section-title">Tools</div>
          <div class="skill-category">
            <div class="skill-label">Cloud & DevOps</div>
            <div class="skill-items" id="toolsCloud">
              <span class="skill-tag view-element">AWS</span>
              <span class="skill-tag view-element">GCP</span>
              <span class="skill-tag view-element">Prometheus</span>
              <input type="text" class="edit-field edit-element" value="AWS, GCP, Prometheus" id="inputToolsCloud" onchange="updateSkills('inputToolsCloud', 'toolsCloud')">
            </div>
          </div>
          <div class="skill-category">
            <div class="skill-label">CI/CD & Monitoring</div>
            <div class="skill-items" id="toolsCI">
              <span class="skill-tag view-element">GitHub Actions</span>
              <span class="skill-tag view-element">GitLab CI</span>
              <span class="skill-tag view-element">Jenkins</span>
              <input type="text" class="edit-field edit-element" value="GitHub Actions, GitLab CI, Jenkins" id="inputToolsCI" onchange="updateSkills('inputToolsCI', 'toolsCI')">
            </div>
          </div>
        </div>

        <!-- EDUCATION -->
        <div class="section">
          <div class="section-title">Education</div>
          <div id="educationList">
            <div class="education-item">
              <div class="education-school">MS Computer Science</div>
              <div class="education-degree">Moscow State University</div>
              <div class="education-date">2014 – 2016</div>
            </div>
            <div class="education-item">
              <div class="education-school">BS Information Technology</div>
              <div class="education-degree">Moscow State University</div>
              <div class="education-date">2010 – 2014</div>
            </div>
          </div>
        </div>

        <!-- LANGUAGES -->
        <div class="section">
          <div class="section-title">Languages</div>
          <div id="languagesList">
            <div class="skill-category">
              <div class="skill-label">English</div>
              <div class="skill-items"><span class="skill-tag view-element">C1 Advanced</span></div>
            </div>
            <div class="skill-category">
              <div class="skill-label">Russian</div>
              <div class="skill-items"><span class="skill-tag view-element">Native</span></div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="font-size: 0.7rem; color: #a0aec0; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
          Template by <a href="https://linkedin.com" target="_blank" style="color: #0066cc;">Viktor Ivanchikov</a>
        </div>
      </div>
    </div>
  </div>

  <script>
    // ========== DEFAULT DATA ==========
    const defaultData = {
      name: 'Иван Петров',
      role: 'Senior DevOps Engineer',
      linkedinURL: 'https://linkedin.com/in/ivan-petrov',
      githubURL: 'https://github.com/ivan-petrov',
      summary: 'Senior DevOps Engineer с 8+ лет опыта в проектировании и управлении инфраструктурой высоконагруженных систем. Специализация: Kubernetes, AWS, Infrastructure as Code, CI/CD pipelines и оптимизация облачных стоимостей. Успешно масштабировал системы для обработки 10M+ запросов в день. Лидер в автоматизации и культуре DevOps. Ментор команд по best practices облачных технологий.',
      jobs: [
        {
          id: 1,
          company: 'TechCorp International',
          role: 'Lead DevOps Engineer',
          startDate: 'Jan 2021',
          endDate: 'Present',
          bullets: [
            'Архитектура, проектирование и управление Kubernetes кластерами на AWS для 500+ микросервисов',
            'Снижение затрат облачной инфраструктуры на 35% через оптимизацию ресурсов и Reserved Instances',
            'Внедрение GitOps подхода с ArgoCD, сокращение time-to-deployment с 2 часов до 5 минут'
          ]
        },
        {
          id: 2,
          company: 'CloudSystems Inc.',
          role: 'Senior DevOps Engineer',
          startDate: 'Mar 2018',
          endDate: 'Dec 2020',
          bullets: [
            'Построение полностью автоматизированного CI/CD pipeline с GitHub Actions и GitLab CI',
            'Миграция монолитного приложения на микросервисную архитектуру с Kubernetes',
            'Ментор команды из 5 младших инженеров по cloud-native practice и IaC (Terraform, CloudFormation)'
          ]
        },
        {
          id: 3,
          company: 'DataFlow Systems',
          role: 'DevOps Engineer',
          startDate: 'Jun 2015',
          endDate: 'Feb 2018',
          bullets: [
            'Автоматизация инфраструктуры с использованием Terraform и Ansible',
            'Имплементация мониторинга и логирования с Prometheus, Grafana, ELK Stack',
            'Оптимизация production системы для обработки 10M+ запросов в день'
          ]
        }
      ],
      impacts: [
        'Архитектура высоконагруженной платформы на Kubernetes (50+ узлов, 1000+ pods)',
        'Снижение операционных затрат на $500K+ в год через облачную оптимизацию',
        'Внедрение zero-downtime deployment через GitOps и blue-green strategies',
        'Построение культуры DevOps в организации (300+ разработчиков способны самостоятельно деплоить)',
        'Автоматизация 90% рутинных операций (provisioning, scaling, monitoring, alerting)'
      ]
    };

    // ========== STATE MANAGEMENT ==========
    let currentMode = 'view'; // 'view' or 'edit'
    let data = { ...defaultData };
    let jobCounter = (data.jobs.length || 0) + 1;
    let impactCounter = (data.impacts.length || 0) + 1;

    // ========== INITIALIZATION ==========
    function initializeResume() {
      loadFromLocalStorage();
      renderJobs();
      renderImpacts();
      setMode('view');
    }

    // ========== MODE SWITCHING ==========
    function setMode(mode) {
      currentMode = mode;
      document.documentElement.classList.remove('view-mode', 'edit-mode');
      document.documentElement.classList.add(mode === 'view' ? 'view-mode' : 'edit-mode');

      document.getElementById('viewBtn').classList.toggle('active', mode === 'view');
      document.getElementById('editBtn').classList.toggle('active', mode === 'edit');

      document.body.classList.remove('view-mode', 'edit-mode');
      document.body.classList.add(mode === 'view' ? 'view-mode' : 'edit-mode');

      if (mode === 'edit') {
        updateInputValues();
      }

      saveToLocalStorage();
    }

    // ========== FIELD EDITING ==========
    function editField(displayId, type) {
      if (currentMode !== 'edit') {
        setMode('edit');
      }
    }

    function updateDisplay(displayId, inputId, type) {
      const input = document.getElementById(inputId);
      const display = document.getElementById(displayId);
      const value = input.value;

      if (type === 'text') {
        display.querySelector('.view-element').textContent = value;
      } else if (type === 'textarea') {
        display.querySelector('.view-element').textContent = value;
      }

      saveToLocalStorage();
    }

    function updateInputValues() {
      document.getElementById('inputName').value = data.name;
      document.getElementById('inputRole').value = data.role;
      document.getElementById('inputSummary').value = data.summary;
    }

    function updateCharCount() {
      const count = document.getElementById('inputSummary').value.length;
      document.getElementById('charCount').textContent = count;
    }

    // ========== JOBS MANAGEMENT ==========
    function renderJobs() {
      const jobsList = document.getElementById('jobsList');
      jobsList.innerHTML = '';

      data.jobs.forEach((job, index) => {
        const jobEl = document.createElement('div');
        jobEl.className = 'job';
        jobEl.innerHTML = \`
          <div class="job-header">
            <div>
              <div class="job-company view-element">\${job.company}</div>
              <input type="text" class="edit-field edit-element" value="\${job.company}" onchange="updateJobField(\${index}, 'company', this.value)">
            </div>
            <div class="job-date">\${job.startDate} – \${job.endDate}</div>
          </div>
          <div class="job-role view-element">\${job.role}</div>
          <input type="text" class="edit-field edit-element" value="\${job.role}" onchange="updateJobField(\${index}, 'role', this.value)">
          <div class="job-bullets">
            \${job.bullets.map((bullet, bIndex) => \`
              <div class="job-bullet view-element">\${bullet}</div>
              <input type="text" class="job-bullet-input edit-element" value="\${bullet}" onchange="updateJobBullet(\${index}, \${bIndex}, this.value)">
            \`).join('')}
          </div>
          <div class="edit-controls edit-element" style="display: flex; gap: 0.25rem;">
            <button class="btn-small" onclick="removeJob(\${index})">Remove</button>
            <button class="btn-small" onclick="moveJobUp(\${index})" \${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn-small" onclick="moveJobDown(\${index})" \${index === data.jobs.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
        \`;
        jobsList.appendChild(jobEl);
      });
    }

    function addJob() {
      data.jobs.unshift({
        id: jobCounter++,
        company: 'New Company',
        role: 'New Role',
        startDate: 'MM/YY',
        endDate: 'Present',
        bullets: ['Achievement 1', 'Achievement 2', 'Achievement 3']
      });
      renderJobs();
      saveToLocalStorage();
    }

    function updateJobField(index, field, value) {
      data.jobs[index][field] = value;
      saveToLocalStorage();
    }

    function updateJobBullet(jobIndex, bulletIndex, value) {
      data.jobs[jobIndex].bullets[bulletIndex] = value;
      saveToLocalStorage();
    }

    function removeJob(index) {
      data.jobs.splice(index, 1);
      renderJobs();
      saveToLocalStorage();
    }

    function moveJobUp(index) {
      if (index > 0) {
        [data.jobs[index], data.jobs[index - 1]] = [data.jobs[index - 1], data.jobs[index]];
        renderJobs();
        saveToLocalStorage();
      }
    }

    function moveJobDown(index) {
      if (index < data.jobs.length - 1) {
        [data.jobs[index], data.jobs[index + 1]] = [data.jobs[index + 1], data.jobs[index]];
        renderJobs();
        saveToLocalStorage();
      }
    }

    // ========== IMPACTS MANAGEMENT ==========
    function renderImpacts() {
      const impactList = document.getElementById('impactList');
      impactList.innerHTML = '';

      data.impacts.forEach((impact, index) => {
        const impactEl = document.createElement('div');
        impactEl.className = 'impact-item';
        impactEl.innerHTML = \`
          <span class="view-element">\${impact}</span>
          <input type="text" class="edit-field edit-element" value="\${impact}" onchange="updateImpact(\${index}, this.value)">
          <div class="edit-controls edit-element" style="display: flex; gap: 0.25rem;">
            <button class="btn-small" onclick="removeImpact(\${index})">Remove</button>
            <button class="btn-small" onclick="moveImpactUp(\${index})" \${index === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn-small" onclick="moveImpactDown(\${index})" \${index === data.impacts.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
        \`;
        impactList.appendChild(impactEl);
      });
    }

    function addImpact() {
      data.impacts.unshift('New achievement or impact');
      renderImpacts();
      saveToLocalStorage();
    }

    function updateImpact(index, value) {
      data.impacts[index] = value;
      saveToLocalStorage();
    }

    function removeImpact(index) {
      data.impacts.splice(index, 1);
      renderImpacts();
      saveToLocalStorage();
    }

    function moveImpactUp(index) {
      if (index > 0) {
        [data.impacts[index], data.impacts[index - 1]] = [data.impacts[index - 1], data.impacts[index]];
        renderImpacts();
        saveToLocalStorage();
      }
    }

    function moveImpactDown(index) {
      if (index < data.impacts.length - 1) {
        [data.impacts[index], data.impacts[index + 1]] = [data.impacts[index + 1], data.impacts[index]];
        renderImpacts();
        saveToLocalStorage();
      }
    }

    // ========== SKILLS UPDATING ==========
    function updateSkills(inputId, displayId) {
      const input = document.getElementById(inputId);
      const display = document.getElementById(displayId);
      const items = input.value.split(',').map(s => s.trim()).filter(s => s);

      display.innerHTML = items.map(item => \`<span class="skill-tag view-element">\${item}</span>\`).join('');

      if (currentMode === 'edit') {
        display.appendChild(input);
      }

      saveToLocalStorage();
    }

    // ========== STORAGE MANAGEMENT ==========
    function saveToLocalStorage() {
      // Обновляем данные из текущего состояния
      data.name = document.getElementById('inputName').value;
      data.role = document.getElementById('inputRole').value;
      data.summary = document.getElementById('inputSummary').value;

      localStorage.setItem('resumeData', JSON.stringify(data));
    }

    function loadFromLocalStorage() {
      const saved = localStorage.getItem('resumeData');
      if (saved) {
        data = JSON.parse(saved);
      }
    }

    // ========== PDF EXPORT ==========
    function exportPDF() {
      const element = document.getElementById('resumePage');
      const opt = {
        margin: 0,
        filename: 'Resume_' + data.name.replace(/\\s+/g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { format: 'a4', orientation: 'portrait', compress: true }
      };

      html2pdf().set(opt).from(element).save();
    }

    // ========== JSON EXPORT ==========
    function exportJSON() {
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume_' + data.name.replace(/\\s+/g, '_') + '.json';
      link.click();
    }

    // ========== JSON IMPORT ==========
    function importJSON() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = event => {
          data = JSON.parse(event.target.result);
          renderJobs();
          renderImpacts();
          updateInputValues();
          saveToLocalStorage();
          alert('Resume imported successfully!');
        };
        reader.readAsText(file);
      };
      input.click();
    }

    // ========== INITIALIZATION ON LOAD ==========
    document.addEventListener('DOMContentLoaded', initializeResume);
  </script>
</body>
</html>`;
}
