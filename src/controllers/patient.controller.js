const patientRepo = require('../repositories/patient.repository');
const doctorRepo = require('../repositories/doctor.repository');
const { ApiError, ok } = require('../utils/response');

/** GET /api/patients?search=&clinicId= */
async function list(req, res, next) {
  try {
    const { search, clinicId } = req.query;
    const patients = await patientRepo.findAll({ search, clinicId });
    ok(res, patients);
  } catch (err) {
    next(err);
  }
}

/** GET /api/patients/:id  -> patient + assigned doctors */
async function getOne(req, res, next) {
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) throw new ApiError(404, 'Patient not found');
    const doctors = await patientRepo.getDoctors(patient.id);
    ok(res, { ...patient, doctors });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const existing = await patientRepo.findByRegistrationNo(req.body.registrationNo);
    if (existing) throw new ApiError(409, 'Registration number already exists');
    const patient = await patientRepo.create(req.body);
    ok(res, patient, 201);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const patient = await patientRepo.update(req.params.id, req.body);
    if (!patient) throw new ApiError(404, 'Patient not found');
    ok(res, patient);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const deleted = await patientRepo.remove(req.params.id);
    if (!deleted) throw new ApiError(404, 'Patient not found');
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/patients/:id/doctors  { doctorId } */
async function assignDoctor(req, res, next) {
  try {
    const patient = await patientRepo.findById(req.params.id);
    if (!patient) throw new ApiError(404, 'Patient not found');
    const requestedDoctorId = String(req.body.doctorId);
    const doctor = /^\d+$/.test(requestedDoctorId)
      ? await doctorRepo.findByNumber(Number(requestedDoctorId))
      : await doctorRepo.findById(requestedDoctorId);
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    await patientRepo.assignDoctor(req.params.id, doctor.id);
    const doctors = await patientRepo.getDoctors(req.params.id);
    ok(res, doctors, 201);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/patients/:id/doctors/:doctorId */
async function unassignDoctor(req, res, next) {
  try {
    const removed = await patientRepo.unassignDoctor(req.params.id, req.params.doctorId);
    if (!removed) throw new ApiError(404, 'Doctor was not assigned to this patient');
    const doctors = await patientRepo.getDoctors(req.params.id);
    ok(res, doctors);
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getOne, create, update, remove, assignDoctor, unassignDoctor };
