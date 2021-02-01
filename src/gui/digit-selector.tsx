import React from 'react'
import { Board } from '../core/types'
import { allCandidates, getAllPoints, getBoardCell } from '../core/utils/sudokuUtils'
import { groupBy } from '../core/utils/misc'

type DigitProps = {
    digit: number
    finished: boolean
    selected: boolean
    onClick: () => void
}

const DigitCircle = (props: DigitProps) => {
    let bgColor = 'white'
    if(props.finished) bgColor = '#aaa'
    if(props.selected) bgColor = '#c5f6b0'
    return (
        <button
            onClick={props.onClick}
            style={{
                backgroundColor: bgColor,
                color: 'inherit',
                border: '1px #333 solid',
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
    direction: 'row' | 'column'
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
        style={{ display: 'flex', flexDirection: props.direction }}
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