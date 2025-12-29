const Company = require('../models/companyModel');

const createCompany = async (req, res) => {
  const { name } = req.body;

  try {
    const newCompanyId = await Company.create(name);
    res.status(201).json({ id: newCompanyId, name });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

const getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
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
    const affectedRows = await Company.delete(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }

    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
};

module.exports = {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany
};
