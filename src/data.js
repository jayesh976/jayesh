export const COMPANY = {
  name: 'Shree Mahaganpati Enterprises',
  slogan: 'Inspiring the Best Solution with Perfection',
  contact: 'Mr Om Jagtap',
  phoneDisplay: '+91 72492 17070',
  phoneTel: '+917249217070',
  whatsapp: '917249217070',
  email: 'Shreemahaganapati72@gmail.com',
  addressLines: ['Pabal Phata, Ramlimg Road,', 'Near Barmecha Complex,', 'Shirur, Pune 412210'],
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Pabal+Phata+Ramlimg+Road+Barmecha+Complex+Shirur+Pune+412210',
};

export const whatsappLink = (text = 'Hello, I have a requirement for Shree Mahaganpati Enterprises.') =>
  `https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(text)}`;

export const unsplash = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const PRODUCTS = [
  ['all-types-of-fasteners', 'All Types of Fasteners', 'Industrial fasteners and related fastening requirements.', 'Industrial fasteners and related fastening requirements. Share the type, size, material and quantity you need.'],
  ['cotton-waste', 'Cotton Waste', 'Cotton waste and related industrial-use material, subject to availability.', 'Cotton waste and related industrial-use material for cleaning and maintenance applications, subject to actual availability.'],
  ['packaging-products', 'Packaging Products', 'Packaging materials and products for industrial and commercial use.', 'Packaging materials and products for industrial and commercial requirements, matched to your product and dispatch needs.'],
  ['wooden-pallets', 'Wooden Pallets', 'Wooden pallets and pallet requirements, backed by our manufacturing background.', 'Wooden pallets and pallet-related requirements, supported by the company’s background in wooden pallet manufacturing.'],
  ['all-types-of-scrap', 'All Types of Scrap', 'Industrial scrap sourcing and supply, as per customer requirement.', 'Industrial scrap sourcing and supply, with categories specified by the actual customer requirement.'],
  ['housekeeping-products', 'Housekeeping Products', 'Industrial and commercial housekeeping and facility-maintenance supplies.', 'Industrial and commercial housekeeping and facility-maintenance supplies for plants, warehouses and offices.'],
  ['plastic-raw-material', 'Plastic Raw Material', 'Plastic raw materials sourced to customer specification.', 'Plastic raw materials and related sourcing requirements, according to customer specifications.'],
  ['industrial-stationery', 'Industrial Stationery', 'Industrial and business stationery for operations and the workplace.', 'Industrial and business stationery used for operational and workplace requirements.'],
  ['construction-material', 'Construction Material', 'Construction materials for project requirements, by specification.', 'Construction materials and related project requirements, based on specification and availability.'],
  ['safety-products', 'Safety Products', 'Personal protective equipment (PPE) and workplace safety supplies.', 'Personal protective equipment (PPE) such as safety helmets, gloves, safety shoes, goggles, ear protection and high-visibility jackets, plus related workplace safety supplies, as per your requirement.'],
].map(([slug, name, desc, long], i) => ({ slug, name, desc, long, no: pad(i) }));

export const SERVICES = [
  ['Sourcing', 'We identify reliable sources for the material, grade and quantity you need, so you don’t have to search vendor by vendor.'],
  ['Vendor coordination', 'One point of contact between you and multiple suppliers, handling follow-ups, confirmations and communication.'],
  ['Procurement support', 'Help with defining requirements, comparing options and placing orders that match your specification.'],
  ['Project / execution coordination', 'Coordinating material supply around your project schedule so the right items reach site when they are needed.'],
  ['Supply & logistics', 'Arranging dispatch and delivery to your plant, warehouse or project site in Pune and across India.'],
  ['Custom requirement management', 'For requirements that don’t fit a standard category, we work from your specification to find a suitable solution.'],
].map(([name, desc], i) => ({ name, desc, no: pad(i) }));

export const INDUSTRIES = [
  ['Engineering & Industrial', 'Manufacturing plants and engineering units that need a steady supply of consumables, fasteners and packaging.', 'Fasteners, cotton waste, packaging products, wooden pallets, housekeeping products', 'photo-1581091226825-a6a2a5aee158', 'Engineer working at an automated industrial machine'],
  ['Automotive', 'Automotive and component manufacturers with packaging, pallet and consumable requirements.', 'Fasteners, packaging products, wooden pallets, plastic raw material, scrap', '', ''],
  ['Construction & Infrastructure', 'Builders and infrastructure projects that need materials coordinated to the site schedule.', 'Construction material, fasteners, housekeeping products', 'photo-1541888946425-d81bb19240f5', 'Construction team reviewing a large foundation site'],
  ['Energy & Utilities', 'Energy and utility operations with maintenance, housekeeping and material supply needs.', 'Cotton waste, fasteners, housekeeping products, industrial stationery', 'photo-1473341304170-971dccb5ac1e', 'High-voltage transmission towers at sunset'],
  ['Commercial Businesses', 'Offices, warehouses and commercial businesses that need workplace and facility supplies.', 'Industrial stationery, housekeeping products, packaging products', '', ''],
].map(([name, desc, supplies, img, alt], i) => ({ name, desc, supplies, img, alt, no: pad(i) }));

export const STEPS = [
  ['Understand the requirement', 'Tell us what you need.', 'We start by understanding exactly what you need: material, specification, quantity, delivery location and timeline.'],
  ['Source & identify the solution', 'We find the right source.', 'We identify suitable sources and options that match your specification and share them with you.'],
  ['Coordinate', 'We manage vendors and schedules.', 'Once confirmed, we coordinate with vendors on order, quality and dispatch so you deal with one point of contact.'],
  ['Deliver & support', 'Supply reaches you, with follow-up.', 'We deliver to your site and stay available for follow-up, repeat orders and changing requirements.'],
].map(([name, short, long], i) => ({ name, short, long, no: pad(i) }));

export const CHECKLIST = ['Material or product category', 'Quantity required', 'Specification, grade or size', 'Delivery location', 'Required timeline'];

export const CATEGORY_OPTIONS = ['General requirement', ...PRODUCTS.map((p) => p.name), 'Services / coordination'];

export const NAV = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Products', '/products'],
  ['Services', '/services'],
  ['Industries', '/industries'],
  ['Founder', '/about#founder'],
];

export const FOOTER_NAV = [
  ['Home', '/'],
  ['About', '/about'],
  ['Products', '/products'],
  ['Services', '/services'],
  ['Industries', '/industries'],
  ['How We Work', '/how-we-work'],
  ['Contact', '/contact'],
];

function pad(i) {
  return String(i + 1).padStart(2, '0');
}
