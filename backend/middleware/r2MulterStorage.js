import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Incoming files land here on their way to R2, one at a time, and are removed
// as soon as the response is sent.
//
// They used to be held in memory instead (multer.memoryStorage), which cost
// twice the size of the file — multer collected the chunks and then
// concatenated them, so two full copies were alive at once — and the memory
// was never handed back to the system afterwards. A 400 MB upload took the
// backend from 100 MB to 907 MB and left it there; production had settled at
// 2.1 GB of a 3.8 GB machine while its JavaScript heap held only 34 MB. Disk
// is the right place for bytes that are only passing through.
const UPLOAD_TMP_DIR = process.env.UPLOAD_TMP_DIR || path.join(os.tmpdir(), 'tth-uploads');

try {
  fs.mkdirSync(UPLOAD_TMP_DIR, { recursive: true });
} catch (error) {
  console.error(`Could not create the upload directory ${UPLOAD_TMP_DIR}:`, error.message);
}

// 100 GB was the old ceiling, which nothing could survive: twenty of those at
// once was the documented limit. Two gigabytes is far more than any lesson
// needs, and twenty of them still fit on the disk. Raise it with
// MAX_UPLOAD_MB if a course ever genuinely needs more, but note that a single
// PUT to R2 tops out near 5 GB — past that this needs a multipart upload.
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 2048;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_TMP_DIR),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '');
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
  },
});

// Records where the bytes were spooled under a name nothing else writes to.
// Several handlers overwrite file.path with the public R2 URL once the upload
// finishes, which would leave the cleanup below with no idea what to delete.
const spoolStorage = {
  _handleFile(req, file, cb) {
    diskStorage._handleFile(req, file, (error, info) => {
      if (error) return cb(error);
      cb(null, { ...info, spooledPath: info.path });
    });
  },
  _removeFile(req, file, cb) {
    diskStorage._removeFile(req, file, cb);
  },
};

/**
 * Create a multer instance that spools uploads to disk for streaming to R2.
 *
 * @param {string} fileType - Type of file (courses, slides, live-sessions, etc.)
 * @param {string} subType - Subtype (covers, content, etc.)
 * @param {Object} options - Additional multer options
 * @returns {multer.Multer} - Configured multer instance
 */
export const createR2Multer = (fileType, subType = null, options = {}) => {
  return multer({
    limits: {
      fileSize: MAX_UPLOAD_BYTES,
      files: 20,
    },
    fileFilter: (req, file, cb) => {
      // file.size is not known yet at this point — the bytes have not arrived.
      // The size limit above is what enforces it, mid-stream.
      if (file.fieldname === 'cover') {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'));
        }
      }
      cb(null, true);
    },
    storage: spoolStorage,
    ...options,
  });
};

/**
 * Deletes the spooled copies once the response has gone out.
 *
 * Registered once, for every request, so it runs whether the upload
 * succeeded, was rejected by a handler, or threw — nothing is left behind to
 * fill the disk.
 */
export const cleanUpSpooledUploads = (req, res, next) => {
  let done = false;

  const removeTempFiles = () => {
    if (done) return;
    done = true;

    const files = [];
    if (req.file) files.push(req.file);
    if (Array.isArray(req.files)) files.push(...req.files);
    else if (req.files && typeof req.files === 'object') {
      for (const group of Object.values(req.files)) {
        if (Array.isArray(group)) files.push(...group);
      }
    }

    for (const file of files) {
      const spooled = file?.spooledPath || file?.path;
      if (!spooled || !String(spooled).startsWith(UPLOAD_TMP_DIR)) continue;
      fs.unlink(spooled, (error) => {
        if (error && error.code !== 'ENOENT') {
          console.warn(`Could not remove the spooled upload ${spooled}:`, error.message);
        }
      });
    }
  };

  res.on('finish', removeTempFiles);
  res.on('close', removeTempFiles);
  next();
};

/**
 * Removes anything an earlier crash left in the spool directory.
 * Called once at startup; only touches files older than a day, so an upload
 * in flight during a restart is never pulled out from under itself.
 */
export const sweepStaleSpooledUploads = () => {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  fs.readdir(UPLOAD_TMP_DIR, (readError, names) => {
    if (readError) return;
    for (const name of names) {
      const full = path.join(UPLOAD_TMP_DIR, name);
      fs.stat(full, (statError, stats) => {
        if (statError || !stats.isFile() || stats.mtimeMs > dayAgo) return;
        fs.unlink(full, () => {});
      });
    }
  });
};

export const uploadTempDir = UPLOAD_TMP_DIR;
export const maxUploadBytes = MAX_UPLOAD_BYTES;

export default {
  createR2Multer,
  cleanUpSpooledUploads,
  sweepStaleSpooledUploads,
  uploadTempDir,
  maxUploadBytes,
};
