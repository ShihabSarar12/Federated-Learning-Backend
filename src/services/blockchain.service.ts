import blockchainRepository from '../repositories/blockchain.repository';
import User from '../models/user.model';
import HttpError from '../errors/http.error';
import logger from '../utilities/logger.utility';
import HttpStatus from '../constants/status.constant';
import ipfsRepository from '../repositories/ipfs.repository';
import fs from 'fs';

type PublicUser = Omit<User, 'password'>;

class BlockchainService {
    constructor() {}

    public storeDataToBlockchain = async (data: number): Promise<string> => {
        const receipt = await blockchainRepository.storeData(data);
        return receipt ?? null;
    };

    public retrieveDataFromBlockchain = async (): Promise<number> => {
        const data = await blockchainRepository.retrieveData();
        return data ?? null;
    };

    public retrieveLastMetaDataFromBlockchain = async (): Promise<{
        cid: string;
        timestamp: string;
        uploader: string;
    } | null> => {
        try {
            const index = await blockchainRepository.getLatestMetaDataIndex();
            const result = await blockchainRepository.retrieveMetaData(index);
            return result ?? null;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Service: Unexpected error occurred in retrieveMetaDataFromBlockchain',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to retrieve last meta data from blockchain',
            );
        }
    };

    public retrieveMetaDataByUploaderAndTimestamp = async (
        uploader: string,
        timestamp: string,
    ): Promise<{
        cid: string;
        timestamp: string;
        uploader: string;
    } | null> => {
        try {
            const result =
                await blockchainRepository.getMetadataByUploaderAndTimestamp(
                    uploader,
                    timestamp,
                );
            return result ?? null;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Service: Unexpected error occurred in retrieveMetaDataFromBlockchain',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to retrieve last meta data from blockchain',
            );
        }
    };

    public storeCIDToBlockchain = async (
        cid: string,
        uploader: string,
    ): Promise<string> => {
        try {
            const transactionHash = await blockchainRepository.storeCID(
                cid,
                uploader,
            );
            if (!transactionHash) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Failed to store cid to blockchain',
                );
            }
            return transactionHash;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Service: Unexpected error occurred in storeCIDToBlockchain',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to store cid to blockchain',
            );
        }
    };

    public uploadFileToIPFS = async (
        filePath: string,
    ): Promise<{
        cid: string;
        fileSize: number;
        originalName: string;
    }> => {
        try {
            const result = await ipfsRepository.uploadFileToIPFS(filePath);
            if (!result) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Failed to upload file to IPFS',
                );
            }
            await fs.promises.unlink(filePath);
            return result;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Blockchain Service: Unexpected error occurred in uploadFileToIPFS',
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
            const file = await ipfsRepository.downloadFileFromIPFS(cid);
            if (!file) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Failed to download file from IPFS',
                );
            }
            return file;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Blockchain Service: Unexpected error occurred in downloadFileFromIPFS',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Failed to download file from IPFS',
            );
        }
    };

    public getTransactionStatus = async (hash: string): Promise<object> => {
        try {
            const status =
                await blockchainRepository.getTransactionStatus(hash);
            if (!status) {
                throw new HttpError(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    'Transaction not found or pending',
                    true,
                );
            }
            return status;
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Blockchain Service: Unexpected error occurred in getTransactionStatus',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Transaction not found or pending',
                true,
            );
        }
    };

    public getCIDsByUploaderDepartment = async (
        user: string,
        start: number,
        limit: number,
    ): Promise<{
        cids: string[];
    }> => {
        try {
            const result =
                await blockchainRepository.getCIDsGroupedByUploaderDepartment(
                    user,
                    start,
                    limit,
                );
            return (
                result ?? {
                    cids: [],
                }
            );
        } catch (error: any) {
            if (error instanceof HttpError) {
                throw error;
            }
            logger.error(
                'Blockchain Service: Unexpected error occurred in getCIDsByUploaderDepartment',
                {
                    error: error?.message ?? error,
                },
            );
            throw new HttpError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                'Transaction not found or pending',
                true,
            );
        }
    };
}

export type { PublicUser };
export default new BlockchainService();
