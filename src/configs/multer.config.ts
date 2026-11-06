import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

const allowedImageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
];

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, '');

        cb(null, `${Date.now()}-${baseName}${ext}`);
    },
});

const fileFilter: multer.Options['fileFilter'] = (
    _req,
    file,
    cb: FileFilterCallback,
) => {
    const isValidImage = allowedImageMimeTypes.includes(file.mimetype);

    if (isValidImage) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'));
    }
};

const multerConfig: multer.Options = {
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
};

export default multerConfig;
