import * as React from 'react';
import { Html, Button, Container, Text, Heading } from '@react-email/components';

interface VerificationEmailProps {
  url: string;
  locale?: string;
  dictionary: {
    title: string;
    text: string;
    button: string;
  };
}

export const VerificationEmail = ({ url, dictionary, locale = 'en' }: VerificationEmailProps) => {
  return (
    <Html lang={locale}>
      <Container>
        <Heading>{dictionary.title}</Heading>
        <Text>{dictionary.text}</Text>
        <Button 
          href={url}
          style={{ background: '#000', color: '#fff', padding: '12px 20px' }}
        >
          {dictionary.button}
        </Button>
      </Container>
    </Html>
  );
};