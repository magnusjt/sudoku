import React from 'react'
import { BoardMetaData } from '../core/utils/getBoardMetaData'
import Button from '@material-ui/core/Button'

// yea I don't give a fuck about this for now.. :P
let globalPuzzleData: BoardMetaData[] = [];
const loadPuzzleData = async () => {
    globalPuzzleData = await fetch(process.env.PUBLIC_URL + '/boards/boards.txt')
        .then(x => x.text())
        .then(x => x
            .split('\n')
            .filter(line => line.trim().length !== 0)
            .map(line => JSON.parse(line) as BoardMetaData)
        )
}

export type PuzzleSelectProps = {
    onPuzzleSelect: (puzzle: BoardMetaData) => void
}

export const PuzzleSelect = (props: PuzzleSelectProps) => {
    const [puzzleData, setPuzzleData] = React.useState<BoardMetaData[]>(globalPuzzleData)

    React.useEffect(() => {
        if(globalPuzzleData.length === 0) {
            loadPuzzleData().then(() => {
                setPuzzleData(globalPuzzleData)
            })
        }
    }, [])

    return (
        <div>
            {puzzleData.map(puzzle => {
                return (
                    <div>
                        <Button onClick={() => props.onPuzzleSelect(puzzle)}>{puzzle.boardData}</Button>
                        <div>
                            {puzzle.difficulty.difficulty}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}