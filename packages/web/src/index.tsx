import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './gui/app'
import CssBaseline from '@material-ui/core/CssBaseline'
import { ThemeProvider } from '@material-ui/core/styles';
import './index.css'
import { theme } from './theme'

ReactDOM.render(
  <React.StrictMode>
      <ThemeProvider theme={theme}>
          <CssBaseline>
            <App />
          </CssBaseline>
      </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
