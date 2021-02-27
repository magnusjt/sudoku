import React from 'react'
import { Board } from '../core/types'
import { allCandidates, getAllPoints, getBoardCell } from '../core/utils/sudokuUtils'
import { groupBy } from '../core/utils/misc'
import {
    backgroundColor, backgroundDisabledColor,
    borderHardColor,
    getContrastText,
    selectedDigitHighlightColor
} from '../theme'

type DigitProps = {
    digit: number
    finished: boolean
    selected: boolean
    onClick: () => void
}

const DigitCircle = (props: DigitProps) => {
    let bgColor = backgroundColor
    if(props.finished) bgColor = backgroundDisabledColor
    if(props.selected) bgColor = selectedDigitHighlightColor
    return (
        <button
            onClick={props.onClick}
            style={{
                backgroundColor: bgColor,
                color: getContrastText(bgColor),
                border: '1px solid',
                borderColor: borderHardColor,
                padding: 4,
                font: 'inherit',
                cursor: 'pointer',
                outline: 'inherit',

                borderRadius: '50%',
                height: 40,
                width: 40,
                margin: 0,
            }}
        >
            {props.digit}
        </button>
    )
}

type DigitSelectorProps = {
    board: Board
    onClickDigit: (digit: number) => void
    selectedDigit: number | null
}

const getFinishedDigits = (board: Board): number[] => {
    const digits = getAllPoints()
        .map(point => getBoardCell(board, point).value)
        .filter(value => value !== null)

    return Object.entries(groupBy(digits, (d) => d))
        .filter(([digit, list]) => list.length === 9)
        .map(([digit]) => Number(digit))
}

export const DigitSelector = (props: DigitSelectorProps) => {
    const board = props.board
    const selectedDigit = props.selectedDigit
    const finishedDigits = React.useMemo(() => getFinishedDigits(board), [board])

    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        {allCandidates.map(digit => {
            return (
                <div style={{ paddingRight: 4 }} key={digit}>
                    <DigitCircle
                        digit={digit}
                        finished={finishedDigits.includes(digit)}
                        selected={selectedDigit === digit}
                        onClick={() => props.onClickDigit(digit)}
                    />
                </div>
            )
        })}
      </div>
    )
}