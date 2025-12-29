USE due_diligence;

-- Insert Sample Companies
INSERT INTO companies (name) VALUES
('Tech Solutions Inc.'),
('Global Innovations Ltd.'),
('Healthcare Systems LLC');

-- Insert Categories
INSERT INTO checklist_categories (name) VALUES
('Corporate Formation & Governance'),
('Ownership, Equity & Control'),
('Licenses, Registrations & Accreditations'),
('Regulatory & Compliance (General + Healthcare)'),
('Contracts & Commercial Agreements'),
('Employment & Workforce'),
('Financial Information'),
('Revenue, Billing & Reimbursement (Healthcare-Specific)'),
('Intellectual Property & Digital Assets'),
('Litigation & Disputes'),
('Insurance & Risk Management'),
('Operations & Facilities'),
('Marketing & Public Communications'),
('Data Privacy, IT & Security (VDR-Relevant)'),
('Certifications & Closing Statements');

-- Insert Checklist Items

-- 1. Corporate Formation & Governance
INSERT INTO checklist_items (category_id, text) VALUES
(1, 'Articles / Certificate of Incorporation or Organization'),
(1, 'Bylaws or Operating Agreement (with all amendments)'),
(1, 'Shareholder / Member Agreements'),
(1, 'Stock or Membership Ledger (issued, outstanding, canceled interests)'),
(1, 'Organizational chart (legal & operational structure)'),
(1, 'Board and shareholder resolutions (material matters)');

-- 2. Ownership, Equity & Control
INSERT INTO checklist_items (category_id, text) VALUES
(2, 'Capitalization table'),
(2, 'Equity issuances, transfers, redemptions'),
(2, 'Profit-sharing or incentive equity plans'),
(2, 'Indemnification agreements (directors, officers, key personnel)');

-- 3. Licenses, Registrations & Accreditations
INSERT INTO checklist_items (category_id, text) VALUES
(3, 'Federal, State, County, Municipal business licenses'),
(3, 'CMS Form 855B / 855A (if applicable) and Medicare welcome letters'),
(3, 'Medicaid enrollment applications and approval letters'),
(3, 'State healthcare facility licenses and renewals'),
(3, 'Facility accreditations and survey reports'),
(3, 'Practitioner licenses (physicians, non-physician practitioners)'),
(3, 'Employee and contractor professional licenses');

-- 4. Regulatory & Compliance (General + Healthcare)
INSERT INTO checklist_items (category_id, text) VALUES
(4, 'HIPAA compliance policies and training materials'),
(4, 'Corporate compliance program documentation'),
(4, 'OSHA, hazardous waste & medication disposal agreements'),
(4, 'State licensure survey reports and correspondence'),
(4, 'Notices of non-compliance or regulatory inquiries (last 5 years)'),
(4, 'Reports filed with federal, state, or local agencies'),
(4, 'Consent decrees, settlements, or corrective action plans');

-- 5. Contracts & Commercial Agreements
INSERT INTO checklist_items (category_id, text) VALUES
(5, 'Insurance payer agreements (commercial, Medicare, Medicaid)'),
(5, 'Vendor agreements (top 10 vendors)'),
(5, 'Technology, SaaS, EHR, billing software agreements'),
(5, 'Equipment and property leases'),
(5, 'Consulting and management agreements'),
(5, 'Billing agent agreements'),
(5, 'Distribution, agency, and sales representative agreements'),
(5, 'Any other agreement or contract signed by the Company');

-- 6. Employment & Workforce
INSERT INTO checklist_items (category_id, text) VALUES
(6, 'Employee handbook and HR policies'),
(6, 'Employment contracts (W-2 / 1099)'),
(6, 'Independent contractor agreements'),
(6, 'Physician and non-physician practitioner contracts'),
(6, 'Non-compete, non-solicitation, confidentiality agreements'),
(6, 'Benefit plans (health, retirement, bonuses, incentives)'),
(6, 'Payroll summaries (last 3 years + YTD)'),
(6, 'EEO-1 reports, affirmative action plans'),
(6, 'Union or labor-related agreements (if any)');

-- 7. Financial Information
INSERT INTO checklist_items (category_id, text) VALUES
(7, 'Audited / unaudited financial statements (3 years + current)'),
(7, 'General ledger and AR/AP aging'),
(7, 'Tax returns (federal, state, local – last 3 years)'),
(7, 'Payroll tax filings and payment confirmations'),
(7, 'Monthly bank statements & reconciliations (last 12 months)'),
(7, 'PPP / COVID-related loan documentation and forgiveness proof'),
(7, 'Business valuations, appraisals, or broker opinions');

-- 8. Revenue, Billing & Reimbursement (Healthcare-Specific)
INSERT INTO checklist_items (category_id, text) VALUES
(8, 'Medicare & Medicaid audits, overpayment notices'),
(8, 'Extended repayment plans and voluntary lien agreements'),
(8, 'Prepayment review notices and claim suspensions'),
(8, 'Insurance audit reports'),
(8, 'Billing, coding, and documentation audit reports'),
(8, 'Total patient encounters (last 2 years + current year)'),
(8, 'Price list of services and products'),
(8, 'Revenue breakdown by service line');

-- 9. Intellectual Property & Digital Assets
INSERT INTO checklist_items (category_id, text) VALUES
(9, 'Trademarks, copyrights, and registrations'),
(9, 'Websites, domain names, and ownership records'),
(9, 'Social media accounts'),
(9, 'Proprietary materials, training content, marketing collateral');

-- 10. Litigation & Disputes
INSERT INTO checklist_items (category_id, text) VALUES
(10, 'Any and all Pending or threatened litigation (civil, regulatory, labor)'),
(10, 'Government investigations or enforcement actions'),
(10, 'Settlement agreements (open or continuing obligations)'),
(10, 'Demand letters, arbitrations, claims history'),
(10, 'Attorney audit inquiry response letters (last 5 years)');

-- 11. Insurance & Risk Management
INSERT INTO checklist_items (category_id, text) VALUES
(11, 'All insurance policies (professional, general, cyber, D&O, workers’ comp)'),
(11, 'Coverage limits, deductibles, carriers, brokers'),
(11, 'Claims history and loss runs (last 5 years)'),
(11, 'Self-insurance or risk retention programs'),
(11, 'Bonding agreements and limits');

-- 12. Operations & Facilities
INSERT INTO checklist_items (category_id, text) VALUES
(12, 'Utility bills (most recent)'),
(12, 'Property inspections and safety reports'),
(12, 'Facility inspection reports (healthcare & general)'),
(12, 'Hazardous waste disposal agreements');

-- 13. Marketing & Public Communications
INSERT INTO checklist_items (category_id, text) VALUES
(13, 'Marketing materials, advertisements, newsletters'),
(13, 'Patient-facing communications'),
(13, 'Training and educational materials');

-- 14. Data Privacy, IT & Security (VDR-Relevant)
INSERT INTO checklist_items (category_id, text) VALUES
(14, 'Data privacy policies'),
(14, 'Cybersecurity policies and controls'),
(14, 'Access control documentation'),
(14, 'Incident response and breach notifications (if any)'),
(14, 'Third-party IT or hosting agreements');

-- 15. Certifications & Closing Statements
INSERT INTO checklist_items (category_id, text) VALUES
(15, 'Certifications of completeness and accuracy'),
(15, 'Officer / authorized signatory attestations');
