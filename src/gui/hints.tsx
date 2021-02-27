import React from 'react'
import { useSelector } from 'react-redux'
import { selectHints } from '../selectors'

export const Hints = (props) => {
    const hints = useSelector(selectHints)

    return (
        <div>
            <h3>Hints</h3>
            <p>If all candidates are placed in the current board, the following techniques are required to get the next digit</p>
            <ul>
                {hints.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
        </div>
    )
}