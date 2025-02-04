import { Box } from '@chakra-ui/react';
import NextImage from 'next/legacy/image';
import React from 'react';

export const BoxedNextImage: React.FC<
  | React.ComponentProps<typeof Box>
  | { src: string | number; alt: string | number }
> = ({ src, alt, ...props }) => (
  <Box
    pos="relative"
    {...props}
    style={{
      objectFit: 'contain',
    }}
  >
    <NextImage {...{ src, alt }} layout="fill" objectFit="contain" />
  </Box>
);
