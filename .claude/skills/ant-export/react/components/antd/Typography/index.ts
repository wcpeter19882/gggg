/**
 * Typography components exports
 */

export { Title } from './Title';
export { Paragraph } from './Paragraph';
export { Text } from './Text';

// Re-export as Typography namespace for Ant Design compatibility
import { Title } from './Title';
import { Paragraph } from './Paragraph';
import { Text } from './Text';

export const Typography = {
  Title,
  Paragraph,
  Text,
};

export default Typography;
