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
import Typography from '@material-ui/core/Typography'
import Divider from '@material-ui/core/Divider'
import { useSelector } from 'react-redux'
import { selectPuzzles, selectUserData } from '../selectors'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { mobileMediaQuery } from './app'
import Paper from '@material-ui/core/Paper'
import { boardBackgroundColor } from '../theme'

export type PuzzleSelectProps = {
    onPuzzleSelect: (puzzle: BoardMetaData, fromProgress: boolean) => void
}

type Tab = {
    type: 'difficulty'
    difficulty: string
} | {
    type: 'custom'
}

export const PuzzleSelect = (props: PuzzleSelectProps) => {
    const isMobile = useMediaQuery(mobileMediaQuery)
    const userData = useSelector(selectUserData)
    const puzzleData = useSelector(selectPuzzles)

    const [selectedTab, setSelectedTab] = React.useState<Tab>({ type: 'difficulty', difficulty: 'easy' })
    const [showTechniques, setShowTechniques] = React.useState(false)

    const puzzles = selectedTab.type === 'custom'
        ? userData.custom.sort((a, b) => new Date(a.date) > new Date(b.date) ? 1 : -1).map(c => c.meta)
        : puzzleData
            .filter(puzzle => puzzle.difficulty.difficulty === selectedTab.difficulty)
            .sort((a, b) => a.techniques.length - b.techniques.length)

    const maxNumberOfTechniques = Math.max(...puzzles.map(t => t.techniques.length))

    const table = (
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
                    const hasProgress = !!userData.progress[puzzle.boardData]
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
                                <Button color={'primary'} size={'small'} onClick={() => props.onPuzzleSelect(puzzle, false)} variant={'contained'}>Play</Button>
                                <span> </span>
                                {hasProgress &&
                                <Button size={'small'} onClick={() => props.onPuzzleSelect(puzzle, true)} variant={'outlined'}>Continue</Button>
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
    )

    const mobileTable = (
        <>
            {puzzles.map((puzzle, i) => {
                const solved = userData.solved.includes(puzzle.boardData)
                const hasProgress = !!userData.progress[puzzle.boardData]
                return (
                    <Paper key={i} variant={'outlined'} style={{ padding: 16, marginBottom: 16, background: boardBackgroundColor }}>
                        <div style={{ marginLeft: -16, marginRight: -16, marginTop: -16 }}>
                            <LinearProgress
                                variant={'determinate'}
                                color={'secondary'}
                                value={Math.round(100 * puzzle.techniques.length / maxNumberOfTechniques)}
                            />
                        </div>
                        <h4>
                            {puzzle.name}
                        </h4>
                        <div>
                            {solved &&
                            <Typography color={'primary'}>Solved!</Typography>
                            }
                        </div>

                        <div>
                            <Button color={'primary'} size={'small'} onClick={() => props.onPuzzleSelect(puzzle, false)} variant={'contained'}>Play</Button>
                            <span> </span>
                            {hasProgress &&
                            <Button size={'small'} onClick={() => props.onPuzzleSelect(puzzle, true)} variant={'outlined'}>Continue</Button>
                            }
                        </div>
                        <div>
                            {showTechniques &&
                            puzzle.techniques.join(', ')
                            }
                        </div>
                    </Paper>
                )
            })}
        </>
    )

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', overflowX: 'auto' }}>
                    <div key={'custom'}>
                        <Button
                            onClick={() => setSelectedTab({ type: 'custom' })}
                            disabled={selectedTab.type === 'custom'}
                        >
                            Custom
                        </Button>
                    </div>
                    {difficulties.map((difficulty) => {
                        return (
                            <div key={difficulty}>
                                <Button
                                    onClick={() => setSelectedTab({ type: 'difficulty', difficulty})}
                                    disabled={selectedTab.type === 'difficulty' && selectedTab.difficulty === difficulty}
                                >
                                    {difficulty}
                                </Button>
                            </div>
                        )
                    })}
                </div>
                <Divider />
            </div>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={() => setShowTechniques(!showTechniques)} variant={'outlined'}>
                    Show/Hide techniques required
                </Button>
            </div>
            <div style={{ flex: '1 1 auto', minHeight: 0}}>
                <div style={{ height: '100%', overflowY: 'auto'}}>
                    {isMobile
                        ? mobileTable
                        : table
                    }
                </div>
            </div>
        </div>
    )
}