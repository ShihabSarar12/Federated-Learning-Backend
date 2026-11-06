import { Router } from 'express';
import blockchainController from '../../controllers/blockchain.controller';
import multer from 'multer';
import multerConfig from '../../configs/multer.config';

const blockchainRouter: Router = Router();
const upload = multer(multerConfig);

blockchainRouter.post(
    '/upload',
    upload.array('files', 50),
    blockchainController.uploadImagesToIPFS,
);

blockchainRouter.post('/download', blockchainController.downloadImagesFromIPFS);

export default blockchainRouter;
