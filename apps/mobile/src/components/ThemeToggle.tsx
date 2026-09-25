import { Pressable } from 'react-native';

export function ThemeToggle() {
  // const { isDarkColorScheme, setColorScheme } = useColorScheme();

  // function toggleColorScheme() {
  //   const newTheme = isDarkColorScheme ? 'light' : 'dark';
  //   setColorScheme(newTheme);
  //   setAndroidNavigationBar(newTheme);
  // }

  return (
    <Pressable
    // onPress={toggleColorScheme}
    >
      {/* {({ pressed }) => (
        <View
          className={cn(
            'flex-1 aspect-square pt-0.5 justify-center items-start web:px-5',
            pressed && 'opacity-70'
          )}
        >
          {isDarkColorScheme ? (
            <MoonStar className='text-foreground' size={23} strokeWidth={1.25} />
          ) : (
            <Sun className='text-foreground' size={24} strokeWidth={1.25} />
          )}
        </View>
      )} */}
    </Pressable>
  );
}
