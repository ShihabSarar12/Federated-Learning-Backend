import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import HttpError from '../errors/http.error';
import HttpStatus from '../constants/status.constant';
import logger from '../utilities/logger.utility';

class IPFSRepository {
    private ipfsAPIURL = 'http://127.0.0.1:5001/api/v0';
    constructor() {}

    public uploadFileToIPFS = async (
        filePath: string,
    ): Promise<{
        cid: string;
        fileSize: number;
        originalName: string;
    }> => {
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            const res = await axios.post(`${this.ipfsAPIURL}/add`, form, {
                headers: form.getHeaders(),
                maxBodyLength: Infinity,
            });

            const data = res.data;
            if (!data) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Failed to upload file to IPFS',
                );
            }
            return {
                cid: data.Hash,
                fileSize: Number(data.Size),
                originalName: data.Name,
            };
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'IPFS Repository: Unexpected error occurred in uploadFileToIPFS',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to upload file to IPFS',
            );
        }
    };

    public downloadFileFromIPFS = async (
        cid: string,
    ): Promise<{ buffer: Buffer; contentType: string; filename: string }> => {
        try {
            const res = await axios.post(`${this.ipfsAPIURL}/cat`, null, {
                params: { arg: cid },
                responseType: 'arraybuffer',
                maxBodyLength: Infinity,
                headers: {
                    Accept: '*/*',
                },
            });
            const fileInfo = await axios.post(`${this.ipfsAPIURL}/ls`, null, {
                params: { arg: cid },
            });

            const filename = fileInfo.data.Objects?.[0]?.Links?.[0]?.Name;

            if (!res?.data) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Failed to download file from IPFS',
                );
            }

            const buffer = Buffer.from(res.data);

            const contentType =
                res.headers['content-type'] &&
                res.headers['content-type'] !== 'application/octet-stream'
                    ? res.headers['content-type']
                    : this.detectImageContentType(buffer);

            return {
                buffer,
                contentType,
                filename: filename || cid,
            };
        } catch (error: any) {
            logger.error(
                'IPFS Repository: Unexpected error occurred in downloadFileFromIPFS',
                {
                    cid,
                    status: error?.response?.status,
                    statusText: error?.response?.statusText,
                    data:
                        typeof error?.response?.data === 'string'
                            ? error.response.data
                            : undefined,
                    error: error?.message ?? error,
                },
            );

            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to download image from IPFS',
            );
        }
    };

    private detectImageContentType(buffer: Buffer): string {
        if (buffer.length >= 4) {
            if (
                buffer[0] === 0x89 &&
                buffer[1] === 0x50 &&
                buffer[2] === 0x4e &&
                buffer[3] === 0x47
            ) {
                return 'image/png';
            }

            if (buffer[0] === 0xff && buffer[1] === 0xd8) {
                return 'image/jpeg';
            }

            if (
                buffer[0] === 0x47 &&
                buffer[1] === 0x49 &&
                buffer[2] === 0x46
            ) {
                return 'image/gif';
            }

            if (
                buffer.length >= 12 &&
                buffer.toString('ascii', 0, 4) === 'RIFF' &&
                buffer.toString('ascii', 8, 12) === 'WEBP'
            ) {
                return 'image/webp';
            }
        }

        return 'application/octet-stream';
    }
}

export default new IPFSRepository();
