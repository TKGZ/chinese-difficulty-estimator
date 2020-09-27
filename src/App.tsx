import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Form from "react-bootstrap/Form";
import ListGroup from "react-bootstrap/ListGroup";
import Jumbotron from "react-bootstrap/Jumbotron";
import Container from "react-bootstrap/Container";
import Popover from "react-bootstrap/Popover";
import PopoverContent from "react-bootstrap/PopoverContent";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import hanzi from "hanzi";
import * as _ from "lodash";
import InteractiveChart, { DataEntry } from "./components/InteractiveChart";
import WordsTable from "./components/WordsTable";

const hanCharacter = new RegExp("[\u4E00-\u9FCC]");
//what percentile of easiest words should be the sentence difficulty
const DIFFICULTY_THRESHOLD = 0.9;

type Frequency = {
  number: string;
  character: string;
  count: string;
  percentage: number;
  pinyin: string;
  meaning: string;
};

const getHsk = (frequencyNumber: number | string): number => {
  if (typeof frequencyNumber === "string")
    frequencyNumber = parseInt(frequencyNumber);
  if (frequencyNumber <= 178) return 1;
  if (frequencyNumber <= 485) return 2;
  if (frequencyNumber <= 623) return 3;
  if (frequencyNumber <= 1071) return 4;
  if (frequencyNumber <= 1709) return 5;
  if (frequencyNumber <= 2633) return 6;
  return 7;
};

//assumes it is sorted
const getHskData = (wordFrequencies: Frequency[]) => {
  let results = [];
  let wordsAtLevel: { [level: number]: number } = {};
  for (let i = 1; i <= 7; i++) {
    wordsAtLevel[i] = 0;
  }
  wordFrequencies.map((f: Frequency) => {
    wordsAtLevel[getHsk(f.number)] += 1;
  });

  //add to data
  for (let i = 1; i <= 7; i++) {
    results.push({
      name: "HSK " + i,
      words: wordsAtLevel[i],
    });
  }
  return results;
};

function App() {
  const [input, setInput] = useState<string>("番茄西红柿北方");
  const [words, setWords] = useState<string[]>([]);
  const [results, setResults] = useState(<h2></h2>);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [chartData, setChartData] = useState<DataEntry[]>([
    {
      name: "HSK 1",
      words: 10,
    },
  ]);

  const handleChange = (event: any) => {
    const value = event.target.value;
    if (typeof value === "string") {
      setInput(value);
    }
  };

  useEffect(() => {
    hanzi.start();
  }, []);

  useEffect(() => {
    const newWords: string[] = _.uniqBy(Array.from(input), (e) => e);
    // const newWords: string[] = hanzi.segment(input);
    setWords(newWords);
  }, [input]);

  useEffect(() => {
    const newFrequencies: Frequency[] = words
      .filter((word) => {
        if (!hanCharacter.test(word)) {
          setFrequencies([]);
          return false;
        }
        return true;
      })
      .map((word) => {
        return hanzi.getCharacterFrequency(word);
      });
    const orderedFrequencies = _.sortBy(newFrequencies, (f: Frequency) =>
      parseInt(f.number)
    );

    if (newFrequencies.length > 0) {
      setFrequencies(orderedFrequencies);
    }
  }, [words]);

  useEffect(() => {
    //update chart data
    let newData = [];

    //update frequency table
    const wordItems = frequencies.map((frequency: Frequency) => {
      const popover = (
        <Popover id="popover-basic">
          <Popover.Title as="h3">
            {frequency.character} {frequency.pinyin}
          </Popover.Title>
          <Popover.Content>
            Frequency: {frequency.number} (HSK {getHsk(frequency.number)})
          </Popover.Content>
          <Popover.Content>Meaning: {frequency.meaning}</Popover.Content>
        </Popover>
      );

      return (
        <Col xs={3} md={3} lg={2} key={frequency.number}>
          <OverlayTrigger
            trigger={["click", "hover"]}
            placement="auto-start"
            overlay={popover}
          >
            <Card>
              <Card.Body>
                <Card.Title style={{ fontSize: "3rem" }}>
                  {frequency.character}
                </Card.Title>
                {/* <Card.Text>{frequency.meaning}</Card.Text> */}
              </Card.Body>
            </Card>
          </OverlayTrigger>
        </Col>
      );
    });
    setResults(
      <Container fluid>
        <Row>{wordItems}</Row>
      </Container>
    );

    //update difficulty
    if (frequencies.length > 0) {
      const id = Math.floor(frequencies.length * DIFFICULTY_THRESHOLD - 1);
      if (frequencies[id]) setDifficulty(frequencies[id].number);
    } else {
      setDifficulty(undefined);
    }

    setChartData(getHskData(frequencies));
  }, [frequencies]);

  return (
    <div className="App">
      <Jumbotron className="center">
        {/* <h1>How difficult?:</h1> */}
        <Form>
          <Form.Group controlId="sentence">
            <Form.Control
              size="lg"
              type="text"
              value={input}
              onChange={handleChange}
              placeholder="Enter sentence"
              maxLength={40}
              // style={{ maxWidth: "20rem", justifySelf: "center" }}
            />
          </Form.Group>
        </Form>
        <h3>
          Overall difficulty:{" "}
          {difficulty ? "HSK " + getHsk(parseInt(difficulty)) : "n/a"}{" "}
        </h3>
        <InteractiveChart data={chartData} />
        <WordsTable />
        {results}
      </Jumbotron>
    </div>
  );
}

export default App;
