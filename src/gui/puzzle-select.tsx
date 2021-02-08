import React from 'react'
import { BoardMetaData } from '../core/utils/getBoardMetaData'
import Button from '@material-ui/core/Button'
import { difficulties } from '../core/solve'
import LinearProgress from '@material-ui/core/LinearProgress'
import Table from '@material-ui/core/Table'
import TableHead from '@material-ui/core/TableHead'
import TableBody from '@material-ui/core/TableBody'
import TableRow from '@material-ui/core/TableRow'
import TableCell from '@material-ui/core/TableCell'
import { UserData } from './storage'
import { Board } from '../core/types'
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'


// yea I don't give a fuck about this for now.. :P
let globalPuzzleData: BoardMetaData[] = [];
const loadPuzzleData = async () => {
    globalPuzzleData = await fetch(process.env.PUBLIC_URL + '/boards/boardsV3.txt')
        .then(x => x.text())
        .then(x => x
            .split('\n')
            .filter(line => line.trim().length !== 0)
            .map(line => JSON.parse(line) as BoardMetaData)
        )
}

export type PuzzleSelectProps = {
    onPuzzleSelect: (puzzle: BoardMetaData, progress?: Board) => void
    userData: UserData
}

export const PuzzleSelect = (props: PuzzleSelectProps) => {
    const {userData} = props
    const [puzzleData, setPuzzleData] = React.useState<BoardMetaData[]>(globalPuzzleData)

    const [selectedDifficulty, setSelectedDifficulty] = React.useState('easy')
    const [showTechniques, setShowTechniques] = React.useState(false)

    React.useEffect(() => {
        if(globalPuzzleData.length === 0) {
            loadPuzzleData().then(() => {
                setPuzzleData(globalPuzzleData)
            })
        }
    }, [])

    const puzzles = puzzleData
        .filter(puzzle => puzzle.difficulty.difficulty === selectedDifficulty)
        .sort((a, b) => a.techniques.length - b.techniques.length)

    const maxNumberOfTechniques = Math.max(...puzzles.map(t => t.techniques.length))

    return (
        <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div>
                <div style={{ display: 'flex'}}>
                {difficulties.map((difficulty) => {
                    return (
                        <div key={difficulty}>
                            <Button
                                onClick={() => setSelectedDifficulty(difficulty)}
                                disabled={selectedDifficulty === difficulty}
                            >
                                {difficulty}
                            </Button>
                        </div>
                    )
                })}
                </div>
                <Divider />
            </div>
            <div>
                <Button onClick={() => setShowTechniques(!showTechniques)}>
                    Show/Hide techniques required
                </Button>
            </div>
            <div style={{ flex: '1 1 auto', minHeight: 0}}>
                <div style={{ height: '100%', overflowY: 'auto'}}>
                    <Table size={'small'}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={10}>#</TableCell>
                                <TableCell width={250}>Name</TableCell>
                                <TableCell width={40} align={'left'} />
                                <TableCell width={40}>Intensity</TableCell>
                                <TableCell width={200} />
                                <TableCell>{showTechniques && 'Techniques'}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                    {puzzles.map((puzzle, i) => {
                        const solved = userData.solved.includes(puzzle.boardData)
                        const progress = userData.progress[puzzle.boardData]
                        return (
                            <TableRow key={i} hover>
                                <TableCell>
                                    {i+1}.
                                </TableCell>
                                <TableCell>
                                    {puzzle.name}
                                </TableCell>
                                <TableCell>
                                    {solved &&
                                    <Typography color={'primary'}>Solved!</Typography>
                                    }
                                </TableCell>
                                <TableCell>
                                    <LinearProgress
                                        variant={'determinate'}
                                        color={'secondary'}
                                        value={Math.round(100 * puzzle.techniques.length / maxNumberOfTechniques)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button color={'primary'} size={'small'} onClick={() => props.onPuzzleSelect(puzzle)} variant={'contained'}>Play</Button>
                                    <span> </span>
                                    {progress &&
                                        <Button size={'small'} onClick={() => props.onPuzzleSelect(puzzle, progress)} variant={'outlined'}>Continue</Button>
                                    }
                                </TableCell>
                                <TableCell>
                                    {showTechniques &&
                                        puzzle.techniques.join(', ')
                                    }
                                </TableCell>
                            </TableRow>
                        )
                    })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}