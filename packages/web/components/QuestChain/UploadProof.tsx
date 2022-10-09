import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  StatusedSubmitButton,
  ToastId,
  Tooltip,
  useDisclosure,
  useToast,
  UseToastOptions,
} from '@metafam/ds';
import { contracts, graphql, helpers } from '@quest-chains/sdk';
import { useWeb3 } from 'lib/hooks';
import { useDropFiles, useDropImage } from 'lib/hooks/useDropFiles';
import { useInputText } from 'lib/hooks/useInputText';
import { useCallback, useRef, useState } from 'react';
import { NETWORK_INFO } from 'utils/networks';
import {
  getQuestChainContract,
  Metadata,
  metadataUploader,
} from 'utils/questChains';

import { MarkdownEditor } from '../MarkdownEditor';
import { UploadFilesForm } from './UploadFilesForm';
import { UploadImageForm } from './UploadImageForm';

export const UploadProof: React.FC<{
  refresh: () => void;
  questId: string;
  name: string;
  questChain: graphql.QuestChainInfoFragment;
}> = ({ refresh, questId, name, questChain }) => {
  const { chainId, provider, address } = useWeb3();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();
  const toastIdRef = useRef<ToastId | undefined>(undefined);

  const addToast = useCallback(
    (options: UseToastOptions) => {
      if (toastIdRef.current) {
        toast.close(toastIdRef.current);
      }
      toastIdRef.current = toast(options);
    },
    [toast, toastIdRef],
  );

  const [isSubmitting, setSubmitting] = useState(false);

  const [proofDescRef, setProofDescription] = useInputText();

  const dropFilesProps = useDropFiles();

  const { files, onResetFiles } = dropFilesProps;

  const dropImageProps = useDropImage();

  const { imageFile, onResetImage } = dropImageProps;

  const onModalClose = useCallback(() => {
    setProofDescription('');
    onResetFiles();
    onResetImage();
    onClose();
  }, [onClose, onResetFiles, onResetImage, setProofDescription]);

  const onSubmit = useCallback(async () => {
    if (
      !chainId ||
      chainId !== questChain.chainId ||
      !provider ||
      !proofDescRef.current
    )
      return;

    setSubmitting(true);
    addToast({
      description: 'Uploading metadata to IPFS via web3.storage',
      duration: null,
      isClosable: true,
    });
    try {
      const [filesHash, imageHash] = await Promise.all([
        files.length ? await metadataUploader.uploadFiles(files) : '',
        imageFile ? await metadataUploader.uploadFiles([imageFile]) : '',
      ]);
      const metadata: Metadata = {
        name: `Submission - QuestChain - ${questChain.name} - Quest - ${questId}. ${name} User - ${address}`,
        description: proofDescRef.current,
        image_url: imageHash ? `ipfs://${imageHash}` : undefined,
        external_url: filesHash ? `ipfs://${filesHash}` : undefined,
      };

      const hash = await metadataUploader.uploadMetadata(metadata);
      const details = `ipfs://${hash}`;
      addToast({
        description:
          'Waiting for Confirmation - Confirm the transaction in your Wallet',
        duration: null,
        isClosable: true,
      });

      const contract = getQuestChainContract(
        questChain.address,
        questChain.version,
        provider.getSigner(),
      );

      const tx = await (questChain.version === '1'
        ? (contract as contracts.V1.QuestChain).submitProofs(
            [questId],
            [details],
          )
        : (contract as contracts.V0.QuestChain).submitProof(questId, details));
      addToast({
        description: 'Transaction submitted. Waiting for 1 block confirmation',
        duration: null,
        isClosable: true,
      });
      const receipt = await tx.wait(1);
      addToast({
        description:
          'Transaction confirmed. Waiting for The Graph to index the transaction data.',
        duration: null,
        isClosable: true,
      });
      await helpers.waitUntilSubgraphIndexed(chainId, receipt.blockNumber);
      addToast({
        description: `Successfully submitted proof`,
        duration: 5000,
        isClosable: true,
      });
      onModalClose();
      refresh();
    } catch (error) {
      addToast({
        description:
          (error as { error?: Error }).error?.message ??
          (error as Error).message,
        duration: 2000,
        isClosable: true,
      });
    }

    setSubmitting(false);
  }, [
    chainId,
    questChain,
    proofDescRef,
    files,
    imageFile,
    questId,
    name,
    onModalClose,
    refresh,
    address,
    provider,
    addToast,
  ]);

  return (
    <Box>
      <Tooltip
        shouldWrapChildren
        label={`Please connect or switch to ${
          NETWORK_INFO[questChain.chainId].label
        }`}
        isDisabled={chainId === questChain.chainId}
      >
        <StatusedSubmitButton
          onClick={onOpen}
          status={null}
          isDisabled={chainId !== questChain.chainId || !address}
          borderWidth={1}
          px={5}
          py={2}
          label="Submit Proof"
        />
      </Tooltip>

      <Modal isOpen={isOpen} onClose={onModalClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="40rem">
          <ModalHeader>{name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel color="main" htmlFor="proofDescRef.current">
                Description
              </FormLabel>
              <Flex w="100%" pb={4}>
                <MarkdownEditor
                  value={proofDescRef.current}
                  onChange={setProofDescription}
                />
              </Flex>
            </FormControl>
            <UploadImageForm
              {...dropImageProps}
              imageProps={{ maxH: '12rem' }}
              formControlProps={{ mb: 4 }}
            />
            <UploadFilesForm {...dropFilesProps} />
          </ModalBody>

          <ModalFooter alignItems="baseline">
            <Button
              variant="ghost"
              onClick={onModalClose}
              color="white"
              _hover={{ bg: '#FFFFFF11' }}
              _active={{ bg: '#FF000011' }}
              mr={3}
            >
              Close
            </Button>
            <StatusedSubmitButton
              px={[8, 12]}
              label="Submit Proof"
              onClick={() => {
                if (!chainId || chainId !== questChain.chainId || !provider) {
                  addToast({
                    description: `Wrong Chain, please switch to ${
                      NETWORK_INFO[questChain.chainId].label
                    }`,
                    duration: 2000,
                    isClosable: true,
                  });
                  return;
                }
                if (!proofDescRef.current) {
                  addToast({
                    description: 'Proof description cannot be empty',
                    duration: 2000,
                    isClosable: true,
                  });
                  return;
                }

                onSubmit();
              }}
              {...{ status: isSubmitting ? 'Submitting...' : null }}
            />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};