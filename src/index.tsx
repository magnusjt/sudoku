import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './gui/app'
import CssBaseline from '@material-ui/core/CssBaseline'

ReactDOM.render(
  <React.StrictMode>
      <CssBaseline>
        <App />
      </CssBaseline>
  </React.StrictMode>,
  document.getElementById('root')
)
