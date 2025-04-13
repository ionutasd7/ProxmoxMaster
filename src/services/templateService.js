/**
 * Template Service
 * Provides methods for managing VM and LXC templates
 */

// Import database module
const { vmTemplateDB, lxcTemplateDB } = require('../../db');

class TemplateService {
  /**
   * Get all VM templates
   * @returns {Promise<Array>} List of VM templates
   */
  async getVMTemplates() {
    try {
      return await vmTemplateDB.getAllVMTemplates();
    } catch (error) {
      console.error('Error getting VM templates:', error);
      throw new Error('Failed to retrieve VM templates');
    }
  }

  /**
   * Get VM template by ID
   * @param {number} id - Template ID
   * @returns {Promise<Object>} VM template
   */
  async getVMTemplateById(id) {
    try {
      return await vmTemplateDB.getVMTemplateById(id);
    } catch (error) {
      console.error(`Error getting VM template with id ${id}:`, error);
      throw new Error('Failed to retrieve VM template');
    }
  }

  /**
   * Create a new VM template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created VM template
   */
  async createVMTemplate(templateData) {
    try {
      return await vmTemplateDB.createVMTemplate(templateData);
    } catch (error) {
      console.error('Error creating VM template:', error);
      throw new Error('Failed to create VM template');
    }
  }

  /**
   * Update a VM template
   * @param {number} id - Template ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Updated VM template
   */
  async updateVMTemplate(id, templateData) {
    try {
      return await vmTemplateDB.updateVMTemplate(id, templateData);
    } catch (error) {
      console.error(`Error updating VM template with id ${id}:`, error);
      throw new Error('Failed to update VM template');
    }
  }

  /**
   * Delete a VM template
   * @param {number} id - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteVMTemplate(id) {
    try {
      return await vmTemplateDB.deleteVMTemplate(id);
    } catch (error) {
      console.error(`Error deleting VM template with id ${id}:`, error);
      throw new Error('Failed to delete VM template');
    }
  }

  /**
   * Get all LXC templates
   * @returns {Promise<Array>} List of LXC templates
   */
  async getLXCTemplates() {
    try {
      return await lxcTemplateDB.getAllLXCTemplates();
    } catch (error) {
      console.error('Error getting LXC templates:', error);
      throw new Error('Failed to retrieve LXC templates');
    }
  }

  /**
   * Get LXC template by ID
   * @param {number} id - Template ID
   * @returns {Promise<Object>} LXC template
   */
  async getLXCTemplateById(id) {
    try {
      return await lxcTemplateDB.getLXCTemplateById(id);
    } catch (error) {
      console.error(`Error getting LXC template with id ${id}:`, error);
      throw new Error('Failed to retrieve LXC template');
    }
  }

  /**
   * Create a new LXC template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created LXC template
   */
  async createLXCTemplate(templateData) {
    try {
      return await lxcTemplateDB.createLXCTemplate(templateData);
    } catch (error) {
      console.error('Error creating LXC template:', error);
      throw new Error('Failed to create LXC template');
    }
  }

  /**
   * Update a LXC template
   * @param {number} id - Template ID
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Updated LXC template
   */
  async updateLXCTemplate(id, templateData) {
    try {
      return await lxcTemplateDB.updateLXCTemplate(id, templateData);
    } catch (error) {
      console.error(`Error updating LXC template with id ${id}:`, error);
      throw new Error('Failed to update LXC template');
    }
  }

  /**
   * Delete a LXC template
   * @param {number} id - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteLXCTemplate(id) {
    try {
      return await lxcTemplateDB.deleteLXCTemplate(id);
    } catch (error) {
      console.error(`Error deleting LXC template with id ${id}:`, error);
      throw new Error('Failed to delete LXC template');
    }
  }

  /**
   * Apply VM template to VM creation parameters
   * @param {number} templateId - Template ID
   * @param {Object} vmParams - VM creation parameters
   * @returns {Promise<Object>} Updated VM parameters
   */
  async applyVMTemplate(templateId, vmParams) {
    try {
      const template = await this.getVMTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Apply template values to VM parameters
      return {
        ...vmParams,
        cores: template.cores,
        memory: template.memory,
        disk: template.disk
      };
    } catch (error) {
      console.error(`Error applying VM template with id ${templateId}:`, error);
      throw new Error('Failed to apply VM template');
    }
  }

  /**
   * Apply LXC template to LXC creation parameters
   * @param {number} templateId - Template ID
   * @param {Object} lxcParams - LXC creation parameters
   * @returns {Promise<Object>} Updated LXC parameters
   */
  async applyLXCTemplate(templateId, lxcParams) {
    try {
      const template = await this.getLXCTemplateById(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Apply template values to LXC parameters
      return {
        ...lxcParams,
        cores: template.cores,
        memory: template.memory,
        swap: template.swap,
        disk: template.disk
      };
    } catch (error) {
      console.error(`Error applying LXC template with id ${templateId}:`, error);
      throw new Error('Failed to apply LXC template');
    }
  }
}

module.exports = new TemplateService();