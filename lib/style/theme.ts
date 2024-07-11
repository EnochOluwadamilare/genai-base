import { createTheme } from '@mui/material/styles';
import colours from '@public/colours.module.css';
import './theme.css';

const isTest = globalThis?.process?.env?.NODE_ENV === 'test';

export const theme = createTheme({
    palette: {
        primary: {
            main: isTest ? '#fff' : colours.primary,
        },
        success: {
            main: '#00972e',
        },
    },
    typography: {
        fontFamily: [
            'Andika',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
});
