const Company = require('../models/companyModel');

const createCompany = async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const newCompanyId = await Company.create(name.trim());
    res.status(201).json({ id: newCompanyId, name: name.trim() });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getCompanyById = async (req, res) => {
  const { id } = req.params;

  try {
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json(company);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const affectedRows = await Company.update(id, name);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ id, name });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const deleteCompany = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Attempting to delete company with ID: ${id}`);
    
    // First, get the company with counts to check for associated data
    const allCompaniesWithCounts = await Company.findAll();
    const companyWithCounts = allCompaniesWithCounts.find(c => Number(c.id) === Number(id));

    if (!companyWithCounts) {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log(`Company found: ${companyWithCounts.name}, counts:`, {
      users: companyWithCounts.user_count,
      responses: companyWithCounts.user_response_count,
      documents: companyWithCounts.document_count
    });

    const userCount = Number(companyWithCounts.user_count) || 0;
    const responseCount = Number(companyWithCounts.user_response_count) || 0;
    const docCount = Number(companyWithCounts.document_count) || 0;
    
    if (userCount > 0 || responseCount > 0 || docCount > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete company with associated data (users, responses, or documents).',
        counts: {
          users: userCount,
          responses: responseCount,
          documents: docCount
        }
      });
    }

    const affectedRows = await Company.delete(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found or already deleted' });
    }

    console.log(`Company ${id} deleted successfully`);
    res.json({ message: 'Company deleted successfully.' });
  } catch (error) {
    console.error('Error deleting company:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};
