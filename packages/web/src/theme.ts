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
export const backgroundColor = theme.palette.background.paper
export const backgroundDisabledColor = lighten(theme.palette.background.paper, 0.2)
export const borderHardColor = darken(textColor, 0.5)

export const boardBackgroundColor = lighten(theme.palette.background.paper, 0.1)
export const boardBorderColor = '#444'
export const boardBorderHardColor = '#333'

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

export const actorColor = '#d3bef8'
export const setValueColor = '#94fa96'
export const eliminationColor = '#f67467'
export const selectedColor = darken(theme.palette.primary.main, 0.3)
export const affectedColor = darken(selectedColor, 0.3)
export const highlightedColor = selectedColor
export const highlightedCandidateColor = lighten(selectedColor, 0.15)
export const selectedDigitHighlightColor = '#66c187'
export const errorColor = '#fc4444'

export const setCandidateColor = darken(setValueColor, 0.1)
export const eliminateCandidateColor = darken(eliminationColor, 0.2)
export const actorCandidateColor = darken(actorColor, 0.2)
export const actorChainCandidateYesColor = darken(setValueColor, 0.2)
export const actorChainCandidateNoColor = '#2475ff'

export const getContrastText = theme.palette.getContrastText