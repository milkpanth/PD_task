// Ported 1:1 from the original app's SCHEMAS object.
// Drives the generic CRUD table + modal used for Requirement / Sprint /
// Member / Defect (per-project) and PD Task / Issue / Backlog / Feedback
// (global) — one schema, one <GenericTable>/<GenericModal> pair.

export const REQ_TYPE_OPTIONS = ['New feature', 'Enhancement', 'Integration', 'Technical Improvement', 'Migration'];
export const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];
export const REQ_STATUS_OPTIONS = ['Open', 'Next phase', 'Reject', 'Analyst', 'Gathering', 'Done'];
export const DEFECT_STATUS_OPTIONS = ['New', 'Open', 'In Progress', 'Fixed', 'Retest', 'Closed', 'Reject'];
export const DEFECT_TYPE_OPTIONS = ['Functional', 'UI/UX', 'Data', 'Performance', 'Integration', 'Security', 'Other'];
export const ENV_OPTIONS = ['Dev', 'SIT', 'UAT', 'Prod'];
export const TEST_RESULT_OPTIONS = ['Pass', 'Fail', 'Not Tested'];

export const CHANGE_TYPE_OPTIONS = ['Requirement', 'Logic', 'UI-UX', 'Bug Fix', 'Flow'];
export const CHANGELOG_STATUS_OPTIONS = ['Open', 'In Progress', 'Review', 'Test', 'Done', 'Reject', 'Waiting Approve'];

export const SCHEMAS = {
  requirement: {
    label: 'Requirement', icon: '📋', table: 'requirements', global: false,
    fields: [
      { key: 'module', type: 'text', label: 'Module' },
      { key: 'feature', type: 'text', label: 'Feature' },
      { key: 'function', type: 'text', label: 'Function' },
      { key: 'detail', type: 'textarea', label: 'Detail' },
      { key: 'businessRule', type: 'textarea', label: 'Business Rule' },
      { key: 'type', type: 'select', label: 'Type', options: REQ_TYPE_OPTIONS },
      { key: 'priority', type: 'select', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', type: 'select', label: 'Status', options: REQ_STATUS_OPTIONS, badge: 'status' },
      { key: 'remark', type: 'text', label: 'Remark' },
    ],
  },
  sprint: {
    label: 'Sprint', icon: '🏁', table: 'sprints', global: false,
    fields: [
      { key: 'name', type: 'text', label: 'Sprint Name' },
      { key: 'startDate', type: 'date', label: 'Start Date' },
      { key: 'endDate', type: 'date', label: 'End Date' },
      { key: 'goal', type: 'textarea', label: 'Sprint Goal' },
      { key: 'remark', type: 'text', label: 'Remark' },
    ],
  },
  member: {
    label: 'Member', icon: '👥', table: 'members', global: false,
    fields: [
      { key: 'name', type: 'text', label: 'ชื่อ (Name)' },
      { key: 'role', type: 'text', label: 'Role' },
      { key: 'department', type: 'text', label: 'แผนก (Department)' },
      { key: 'remark', type: 'text', label: 'Remark' },
    ],
  },
  defect: {
    label: 'Defect', icon: '🐞', table: 'defects', global: false,
    fields: [
      { key: 'module', type: 'text', label: 'Module' },
      { key: 'function', type: 'text', label: 'Function' },
      { key: 'defectDetail', type: 'textarea', label: 'Defect Detail / Test Step' },
      { key: 'assignee', type: 'text', label: 'Assignee' },
      { key: 'env', type: 'select', label: 'Env', options: ENV_OPTIONS },
      { key: 'priority', type: 'select', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', type: 'select', label: 'Status', options: DEFECT_STATUS_OPTIONS, badge: 'status' },
      { key: 'defectType', type: 'select', label: 'Defect Type', options: DEFECT_TYPE_OPTIONS },
      { key: 'createdDate', type: 'date', label: 'Created Date' },
      { key: 'testResult', type: 'select', label: 'Test Result', options: TEST_RESULT_OPTIONS, badge: 'status' },
      { key: 'remark', type: 'textarea', label: 'Remark' },
    ],
  },
  changelog: {
    label: 'Change Log', icon: '🔀', table: 'changeLog', global: false,
    fields: [
      { key: 'changeId', type: 'autoId', label: 'Change ID', prefix: 'CR', pad: 3 },
      { key: 'changeDetail', type: 'textarea', label: 'Change Detail' },
      { key: 'changeType', type: 'select', label: 'Change Type', options: CHANGE_TYPE_OPTIONS },
      { key: 'impactAnalysis', type: 'textarea', label: 'Impact Analysis' },
      { key: 'reqRef', type: 'text', label: 'Related Req Spec Ref.' },
      { key: 'status', type: 'select', label: 'Status', options: CHANGELOG_STATUS_OPTIONS, badge: 'status' },
      { key: 'changeBy', type: 'text', label: 'Change By' },
      { key: 'changeDate', type: 'date', label: 'Change Date' },
      { key: 'approvedBy', type: 'text', label: 'Approved By' },
      { key: 'dateApproved', type: 'date', label: 'Date Approved' },
      { key: 'targetRelease', type: 'text', label: 'Target Release' },
      { key: 'productVersion', type: 'text', label: 'Product Version' },
      { key: 'remarks', type: 'text', label: 'Remarks' },
    ],
  },
  pdtask: {
    label: 'PD Task', icon: '🗂️', table: 'pdTasks', global: true,
    fields: [
      { key: 'title', type: 'text', label: 'ชื่อ Task' },
      { key: 'assignee', type: 'profileSelect', label: 'Assignee' },
      { key: 'startDate', type: 'date', label: 'Start Date' },
      { key: 'endDate', type: 'date', label: 'End Date' },
      { key: 'priority', type: 'select', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', type: 'select', label: 'Status', options: ['To do', 'In Progress', 'In Review', 'Done'], badge: 'status' },
    ],
  },
  pdissue: {
    label: 'Issue', icon: '🐞', table: 'pdIssues', global: true,
    fields: [
      { key: 'title', type: 'text', label: 'หัวข้อ' },
      { key: 'module', type: 'text', label: 'Module' },
      { key: 'severity', type: 'select', label: 'Severity', options: PRIORITY_OPTIONS },
      { key: 'status', type: 'select', label: 'Status', options: ['Open', 'In Progress', 'Resolved', 'Closed'], badge: 'status' },
      { key: 'reporter', type: 'text', label: 'ผู้แจ้ง' },
      { key: 'remark', type: 'textarea', label: 'Remark' },
    ],
  },
  pdbacklog: {
    label: 'Backlog', icon: '📥', table: 'pdBacklog', global: true,
    fields: [
      { key: 'title', type: 'text', label: 'หัวข้อ' },
      { key: 'type', type: 'select', label: 'Type', options: ['Feature', 'Improvement', 'Bug', 'Tech Debt'] },
      { key: 'priority', type: 'select', label: 'Priority', options: PRIORITY_OPTIONS },
      { key: 'status', type: 'select', label: 'Status', options: ['Backlog', 'Planned', 'In Sprint'], badge: 'status' },
      { key: 'remark', type: 'textarea', label: 'Remark' },
    ],
  },
  pdfeedback: {
    label: 'Product Feedback', icon: '💬', table: 'pdFeedback', global: true,
    fields: [
      { key: 'productId', type: 'masterSelect', label: 'Product', masterTable: 'productMasters', masterLabel: 'name' },
      { key: 'source', type: 'text', label: 'ที่มา (ลูกค้า/ช่องทาง)' },
      { key: 'feedback', type: 'textarea', label: 'Feedback' },
      { key: 'sentiment', type: 'select', label: 'Sentiment', options: ['Positive', 'Neutral', 'Negative'] },
      { key: 'status', type: 'select', label: 'Status', options: ['New', 'Reviewing', 'Planned', 'Rejected', 'Done'], badge: 'status' },
    ],
  },
  productmaster: {
    label: 'Product Master', icon: '📦', table: 'productMasters', global: true,
    fields: [
      { key: 'name', type: 'text', label: 'ชื่อ Product', required: true },
      { key: 'category', type: 'text', label: 'Category' },
      { key: 'description', type: 'textarea', label: 'รายละเอียด' },
      { key: 'status', type: 'select', label: 'Status', options: ['Active', 'Inactive'], badge: 'status' },
    ],
  },
};

export function genericStatusColor(v) {
  const s = (v || '').toLowerCase();
  if (['done', 'fixed', 'closed', 'pass', 'resolved'].includes(s)) return 'status-donedt';
  if (['reject', 'fail', 'rejected'].includes(s)) return 'status-blocked';
  if (['in progress', 'retest', 'in sprint', 'test'].includes(s)) return 'status-inprogress';
  if (['review', 'analyst', 'gathering', 'next phase', 'in review', 'reviewing', 'waiting approve'].includes(s)) return 'status-review';
  return 'status-todo';
}

export function genericPriorityColor(v) {
  const s = (v || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'p-high';
  if (s === 'medium') return 'p-med';
  return 'p-low';
}
