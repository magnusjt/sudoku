import React from 'react'
import ReactDOM from 'react-dom'
import { App } from './gui/app'
import CssBaseline from '@material-ui/core/CssBaseline'
import { ThemeProvider } from '@material-ui/core/styles'
import './index.css'
import { theme } from './theme'
import { Provider as ReduxProvider } from 'react-redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { applyMiddleware, createStore } from 'redux'
import { createActions, createStorageMiddleware, reducer } from './state'
import { loadUserData, storeUserData } from './storage'
import { BoardMetaData } from './core/utils/getBoardMetaData'

const storage = {
    store: storeUserData
}

const middleware = applyMiddleware(createStorageMiddleware(storage))
const enhancer = composeWithDevTools(middleware)
export const store = createStore(reducer, enhancer)
export const actions = createActions(store.dispatch)

actions.setUserData(loadUserData())

fetch(process.env.PUBLIC_URL + '/boards/boardsV6.txt')
    .then(x => x.text())
    .then(x => x
        .split('\n')
        .filter(line => line.trim().length !== 0)
        .map(line => JSON.parse(line) as BoardMetaData)
    )
    .then(puzzleData => actions.setPuzzles(puzzleData))

ReactDOM.render(
  <React.StrictMode>
      <ThemeProvider theme={theme}>
          <CssBaseline>
              <ReduxProvider store={store}>
                <App />
              </ReduxProvider>
          </CssBaseline>
      </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
)
