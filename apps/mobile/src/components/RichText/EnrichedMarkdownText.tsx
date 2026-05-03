import { useMarkdownStyle } from '../../hooks/useMarkdownStyle';
import {
  EnrichedMarkdownText as EnrichedMarkdownTextBase,
  EnrichedMarkdownTextProps,
} from 'react-native-enriched-markdown';

const EnrichedMarkdownText = ({ markdownStyle, ...props }: EnrichedMarkdownTextProps) => {
  const markdownStyleDefault = useMarkdownStyle();
  return (
    <EnrichedMarkdownTextBase
      markdownStyle={{
        ...markdownStyleDefault,
        ...markdownStyle,
      }}
      {...props}
    />
  );
};

export { EnrichedMarkdownText };
