import { ThemeProvider } from '@emotion/react';
import { StyledEngineProvider } from '@mui/material';
import { theme as defaultTheme } from '../../style/theme';
import { createStore, Provider } from 'jotai';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { RouterProviderProps } from 'react-router';
import Loading from '../Loading/Loading';

interface Props {
    theme?: typeof defaultTheme;
    store?: ReturnType<typeof createStore>;
    router: RouterProviderProps['router'];
}

export default function Application({ theme = defaultTheme, store, router }: Props) {
    return (
        <StyledEngineProvider injectFirst>
            <ThemeProvider theme={theme}>
                <Provider store={store}>
                    <Suspense
                        fallback={
                            <Loading
                                loading={true}
                                message="..."
                            />
                        }
                    >
                        <RouterProvider router={router} />
                    </Suspense>
                </Provider>
            </ThemeProvider>
        </StyledEngineProvider>
    );
}
