import { theme } from '@base/main';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { StoryDecorator } from '@ladle/react';
import { Provider } from 'jotai';

export const Theme: StoryDecorator = (Component) => (
    <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
            <Component />
        </ThemeProvider>
    </StyledEngineProvider>
);

export const Recoil: StoryDecorator = (Component) => (
    <Provider>
        <Component />
    </Provider>
);
