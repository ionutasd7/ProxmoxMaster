/**
 * Application Constants
 * Contains global constants used throughout the application
 */

// API Endpoints
const API = {
  LOGIN: '/api/login',
  NODES: '/api/nodes',
  TEST_CONNECTION: '/api/test-connection',
  TEST_SSH: '/api/test-ssh',
  VMS: '/api/nodes/{id}/vms',
  CONTAINERS: '/api/nodes/{id}/containers',
  VM_TEMPLATES: '/api/templates/vm',
  LXC_TEMPLATES: '/api/templates/lxc',
  MONITORING: '/api/monitoring/node/{id}'
};

// Local Storage Keys
const STORAGE = {
  AUTH_DATA: 'proxmox_manager_auth',
  SELECTED_NODE: 'proxmox_manager_selected_node',
  THEME: 'proxmox_manager_theme',
  SETTINGS: 'proxmox_manager_settings'
};

// Application Views
const VIEWS = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  NODES: 'nodes',
  VM_LIST: 'vm-list',
  VM_CREATE: 'vm-create',
  LXC_LIST: 'lxc-list',
  LXC_CREATE: 'lxc-create',
  TEMPLATES: 'templates',
  MONITORING: 'monitoring',
  SETTINGS: 'settings'
};

// Routes
const ROUTES = {
  [VIEWS.LOGIN]: { title: 'Login', icon: 'sign-in-alt' },
  [VIEWS.DASHBOARD]: { title: 'Dashboard', icon: 'tachometer-alt' },
  [VIEWS.NODES]: { title: 'Nodes Overview', icon: 'server' },
  [VIEWS.VM_LIST]: { title: 'Virtual Machines', icon: 'desktop' },
  [VIEWS.VM_CREATE]: { title: 'Create VM', icon: 'plus-circle' },
  [VIEWS.LXC_LIST]: { title: 'Containers', icon: 'cube' },
  [VIEWS.LXC_CREATE]: { title: 'Create Container', icon: 'plus-circle' },
  [VIEWS.TEMPLATES]: { title: 'Templates', icon: 'copy' },
  [VIEWS.MONITORING]: { title: 'Resource Monitoring', icon: 'chart-line' },
  [VIEWS.SETTINGS]: { title: 'Settings', icon: 'cog' }
};

// Node actions
const NODE_ACTIONS = {
  START: 'start',
  STOP: 'stop',
  RESTART: 'restart',
  SHUTDOWN: 'shutdown',
  HIBERNATE: 'hibernate',
  MIGRATE: 'migrate',
  DELETE: 'delete'
};

// Status mapping for visual representation
const STATUS = {
  RUNNING: { label: 'Running', class: 'bg-success', icon: 'check-circle' },
  STOPPED: { label: 'Stopped', class: 'bg-danger', icon: 'stop-circle' },
  PAUSED: { label: 'Paused', class: 'bg-warning', icon: 'pause-circle' },
  SUSPENDED: { label: 'Suspended', class: 'bg-warning', icon: 'moon' },
  UNKNOWN: { label: 'Unknown', class: 'bg-secondary', icon: 'question-circle' }
};

// Resource Units
const UNITS = {
  CPU: 'cores',
  MEMORY: 'MB',
  STORAGE: 'GB',
  NETWORK: 'Mbps'
};

// OS Templates
const OS_TEMPLATES = {
  LINUX: [
    { id: 'debian11', label: 'Debian 11' },
    { id: 'ubuntu2204', label: 'Ubuntu 22.04 LTS' },
    { id: 'centos8', label: 'CentOS 8' },
    { id: 'fedora35', label: 'Fedora 35' },
    { id: 'arch', label: 'Arch Linux' }
  ],
  WINDOWS: [
    { id: 'win10', label: 'Windows 10' },
    { id: 'win11', label: 'Windows 11' },
    { id: 'win2019', label: 'Windows Server 2019' },
    { id: 'win2022', label: 'Windows Server 2022' }
  ],
  OTHER: [
    { id: 'freebsd13', label: 'FreeBSD 13' },
    { id: 'netbsd9', label: 'NetBSD 9' }
  ]
};

// LXC Templates
const LXC_TEMPLATES = [
  { id: 'debian-11-standard', label: 'Debian 11 Standard' },
  { id: 'ubuntu-22.04-standard', label: 'Ubuntu 22.04 Standard' },
  { id: 'centos-8-standard', label: 'CentOS 8 Standard' },
  { id: 'alpine-3.16-default', label: 'Alpine 3.16 Default' },
  { id: 'fedora-36-standard', label: 'Fedora 36 Standard' }
];