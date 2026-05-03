import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { UseHeaderSearchBarProps } from './useHeaderSearchBar';
import { SearchBar } from '../components/ui/searchbar';

export const useHeaderSearchBar = ({
  placeholder,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}: UseHeaderSearchBarProps): NativeStackNavigationOptions => {
  return {
    headerTitle: () => (
      <SearchBar
        placeholder={placeholder}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    ),
  };
};
