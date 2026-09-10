import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL Database (nhs_hospital_agent)...');

  // Delete existing records
  await prisma.admissions.deleteMany();
  await prisma.beds.deleteMany();
  await prisma.doctors.deleteMany();
  await prisma.services.deleteMany();
  await prisma.facilities.deleteMany();
  await prisma.wards.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.patients.deleteMany();

  // 1. Departments
  const deptCardiology = await prisma.departments.create({
    data: {
      department_name: 'Cardiology',
      description: 'Comprehensive cardiovascular care and diagnostic services.',
    },
  });

  const deptEmergency = await prisma.departments.create({
    data: {
      department_name: 'Emergency Medicine',
      description: '24/7 Level 1 Trauma and Resuscitation emergency care.',
    },
  });

  const deptGeneral = await prisma.departments.create({
    data: {
      department_name: 'General Medicine',
      description: 'Inpatient and outpatient general clinical medical care.',
    },
  });

  // 2. Doctors
  const drSmith = await prisma.doctors.create({
    data: {
      doctor_name: 'Dr. Sarah Jenkins',
      specialization: 'Consultant Cardiologist',
      department_id: deptCardiology.department_id,
      phone: '+44 7700 900001',
      email: 'dr.jenkins@nhs.demo',
    },
  });

  const drPatel = await prisma.doctors.create({
    data: {
      doctor_name: 'Dr. Rajesh Patel',
      specialization: 'Emergency Physician',
      department_id: deptEmergency.department_id,
      phone: '+44 7700 900002',
      email: 'dr.patel@nhs.demo',
    },
  });

  // 3. Patients
  const patient1 = await prisma.patients.create({
    data: {
      patient_code: 'NHS-904-218',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: new Date('1979-05-14'),
      gender: 'Male',
      phone: '+44 7700 900003',
      address: '124 High Street, London',
      blood_group: 'A+',
    },
  });

  const patient2 = await prisma.patients.create({
    data: {
      patient_code: 'NHS-812-401',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: new Date('1962-11-20'),
      gender: 'Female',
      phone: '+44 7700 900004',
      address: '45 Oxford Road, London',
      blood_group: 'O-',
    },
  });

  const patient3 = await prisma.patients.create({
    data: {
      patient_code: 'NHS-731-902',
      first_name: 'Robert',
      last_name: 'Brown',
      date_of_birth: new Date('1966-03-08'),
      gender: 'Male',
      phone: '+44 7700 900005',
      address: '89 Victoria Lane, London',
      blood_group: 'B+',
    },
  });

  // 4. Wards & Beds
  const wardA = await prisma.wards.create({
    data: {
      ward_name: 'Acute Medical Unit (AMU)',
      ward_type: 'Acute Care',
      floor: 1,
    },
  });

  const wardB = await prisma.wards.create({
    data: {
      ward_name: 'Coronary Care Unit (CCU)',
      ward_type: 'Cardiology',
      floor: 2,
    },
  });

  const bed1 = await prisma.beds.create({
    data: {
      bed_number: 'AMU-01',
      ward_id: wardA.ward_id,
      status: 'Occupied',
    },
  });

  const bed2 = await prisma.beds.create({
    data: {
      bed_number: 'AMU-02',
      ward_id: wardA.ward_id,
      status: 'Available',
    },
  });

  const bed3 = await prisma.beds.create({
    data: {
      bed_number: 'CCU-01',
      ward_id: wardB.ward_id,
      status: 'Occupied',
    },
  });

  // 5. Admissions
  await prisma.admissions.create({
    data: {
      patient_id: patient1.patient_id,
      doctor_id: drSmith.doctor_id,
      ward_id: wardA.ward_id,
      bed_id: bed1.bed_id,
      admission_reason: 'Acute shortness of breath & hypertensive urgency assessment',
      status: 'Admitted',
    },
  });

  await prisma.admissions.create({
    data: {
      patient_id: patient3.patient_id,
      doctor_id: drSmith.doctor_id,
      ward_id: wardB.ward_id,
      bed_id: bed3.bed_id,
      admission_reason: 'Post cardiac catheterization monitoring',
      status: 'Admitted',
    },
  });

  // 6. Facilities
  const fac1 = await prisma.facilities.create({
    data: {
      name: 'Emergency Department (A&E)',
      category: 'Emergency',
      type: 'Acute Care',
      description: '24/7 Level 1 Emergency Trauma Unit providing immediate resuscitation and acute care.',
      location: 'Ground Floor, Block A',
      floor: 'Ground Floor',
      contact_phone: '+44 20 7946 0001',
      email: 'ed@nhs-hospital.demo',
      opening_hours: 'Open 24 hours',
      status: 'OPEN',
      accessibility_info: 'Wheelchair ramp, Automatic doors, Braille signage',
      is_staff_only: false,
    },
  });

  const fac2 = await prisma.facilities.create({
    data: {
      name: 'Cardiology Outpatient Clinic',
      category: 'Clinical',
      type: 'Specialist Care',
      description: 'Consultations, echocardiograms, ECG diagnostics, and cardiac rehabilitation.',
      location: '1st Floor, Wing B',
      floor: '1st Floor',
      contact_phone: '+44 20 7946 0002',
      email: 'cardiology@nhs-hospital.demo',
      opening_hours: 'Mon-Fri 08:00-18:00',
      status: 'OPEN',
      accessibility_info: 'Elevator access, Hearing loop installed',
      is_staff_only: false,
    },
  });

  const fac3 = await prisma.facilities.create({
    data: {
      name: 'Central Diagnostic Imaging & Radiology',
      category: 'Diagnostics',
      type: 'Imaging',
      description: 'MRI, CT scan, digital X-ray, and ultrasound diagnostic services.',
      location: 'Ground Floor, Block C',
      floor: 'Ground Floor',
      contact_phone: '+44 20 7946 0003',
      email: 'radiology@nhs-hospital.demo',
      opening_hours: 'Open 24 hours',
      status: '24_7',
      accessibility_info: 'Full wheelchair accessibility',
      is_staff_only: false,
    },
  });

  // 7. Services
  await prisma.services.create({
    data: {
      name: '24/7 Resuscitation & Emergency Care',
      category: 'Emergency',
      facility_id: fac1.id,
      department_id: deptEmergency.department_id,
      location: 'Ground Floor, Block A',
      opening_hours: 'Open 24 hours',
      status: 'OPEN',
      is_staff_only: false,
      description: 'Immediate trauma and critical stabilization for life-threatening conditions.',
    },
  });

  await prisma.services.create({
    data: {
      name: 'Outpatient Echocardiography & ECG',
      category: 'Diagnostics',
      facility_id: fac2.id,
      department_id: deptCardiology.department_id,
      location: '1st Floor, Wing B',
      opening_hours: 'Mon-Fri 08:00-17:00',
      status: 'OPEN',
      is_staff_only: false,
      description: 'Diagnostic cardiac imaging, stress tests, and Holter monitoring.',
    },
  });

  await prisma.services.create({
    data: {
      name: 'High-Field 3T MRI & CT Scanning',
      category: 'Imaging',
      facility_id: fac3.id,
      department_id: deptGeneral.department_id,
      location: 'Ground Floor, Block C',
      opening_hours: 'Open 24 hours',
      status: 'OPEN',
      is_staff_only: false,
      description: 'Advanced neuroradiology, musculoskeletal, and body MRI scanning.',
    },
  });

  console.log('✅ PostgreSQL Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
