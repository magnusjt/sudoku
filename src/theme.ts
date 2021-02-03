import { createMuiTheme, darken, lighten } from '@material-ui/core/styles'

export const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary: {
            main: '#72d282',
        },
        secondary: {
            main: '#80DEEA',
        },
        text: {
            primary: '#efefef'
        },
    },
    typography: {
        button: {
            textTransform: 'none'
        }
    }
})

export const textColor = theme.palette.text.primary
export const textLightColor = darken(theme.palette.text.secondary, 0.0)
export const backgroundColor = theme.palette.background.paper
export const backgroundSecondaryColor = lighten(theme.palette.background.paper, 0.05)
export const backgroundDisabledColor = lighten(theme.palette.background.paper, 0.2)
export const borderColor = theme.palette.divider
export const borderHardColor = darken(textColor, 0.5)

/*
Light
export const actorColor = '#c5f6b0'
export const setValueColor = '#85ffff'
export const eliminationColor = '#b0c9f6'
export const selectedColor = '#ffc0b0'
export const affectedColor = backgroundSecondaryColor
export const highlightedColor = '#ffc0b0'
export const selectedDigitHighlightColor = '#ffd0b0'
export const errorColor = '#fc4444'
 */

export const actorColor = '#cdb0f6'
export const setValueColor = '#85ff87'
export const eliminationColor = '#ff5442'
export const selectedColor = '#72d282'
export const affectedColor = backgroundSecondaryColor
export const highlightedColor = '#72d282'
export const selectedDigitHighlightColor = '#87f6af'
export const errorColor = '#fc4444'

export const getContrastText = theme.palette.getContrastText