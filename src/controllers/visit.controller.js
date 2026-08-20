const path = require('path');
const fs = require('fs');
const visitRepo = require('../repositories/visit.repository');
const patientRepo = require('../repositories/patient.repository');
const { fileTypeFromMime } = require('../middleware/upload');
const { ApiError, ok } = require('../utils/response');

/** GET /api/patients/:patientId/visits */
async function listForPatient(req, res, next) {
  try {
    const patient = await patientRepo.findById(req.params.patientId);
    if (!patient) throw new ApiError(404, 'Patient not found');
    ok(res, await visitRepo.findByPatient(patient.id));
  } catch (err) {
    next(err);
  }
}

/** GET /api/visits/:id */
async function getOne(req, res, next) {
  try {
    const visit = await visitRepo.findById(req.params.id);
    if (!visit) throw new ApiError(404, 'Visit not found');
    ok(res, visit);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/patients/:patientId/visits
 * multipart/form-data:
 *   clinicId, doctorId, visitDate, notes  (text fields)
 *   files[]                               (up to 5 photo/pdf attachments)
 */
async function create(req, res, next) {
  try {
    const patient = await patientRepo.findById(req.params.patientId);
    if (!patient) throw new ApiError(404, 'Patient not found');

    const { clinicId, doctorId, visitDate, notes } = req.body;

    const files = (req.files || []).map((f) => ({
      fileName: f.originalname,
      filePath: f.path,
      fileType: fileTypeFromMime(f.mimetype),
      fileSize: f.size,
    }));

    const visit = await visitRepo.create({
      patientId: patient.id,
      clinicId,
      doctorId: doctorId || null,
      visitDate,
      notes,
      createdBy: req.user?.id,
      files,
    });

    ok(res, visit, 201);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/visits/:id  (also removes attached files from disk) */
async function remove(req, res, next) {
  try {
    const visit = await visitRepo.findById(req.params.id);
    if (!visit) throw new ApiError(404, 'Visit not found');

    for (const f of visit.files) {
      fs.unlink(f.file_path, () => {}); // best-effort cleanup, ignore errors
    }
    await visitRepo.remove(req.params.id);
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/visits/files/:fileId/open
 * Streams the prescription file back so the mobile app can view/open it
 * (image preview or PDF viewer) using the URL directly, e.g. in an
 * <Image> widget or a PDF viewer package.
 */
async function openFile(req, res, next) {
  try {
    const file = await visitRepo.findFileById(req.params.fileId);
    if (!file) throw new ApiError(404, 'File not found');
    if (!fs.existsSync(file.file_path)) {
      throw new ApiError(410, 'File no longer exists on the server');
    }

    const mime = file.file_type === 'pdf' ? 'application/pdf' : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`);
    fs.createReadStream(path.resolve(file.file_path)).pipe(res);
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/visits/files/:fileId */
async function removeFile(req, res, next) {
  try {
    const file = await visitRepo.findFileById(req.params.fileId);
    if (!file) throw new ApiError(404, 'File not found');
    fs.unlink(file.file_path, () => {});
    await visitRepo.removeFile(req.params.fileId);
    ok(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { listForPatient, getOne, create, remove, openFile, removeFile };
