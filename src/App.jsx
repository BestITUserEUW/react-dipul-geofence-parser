import { useState, useRef, useEffect } from 'react'
import { XMLParser } from "fast-xml-parser"
import { Layout, Upload, Button, message, Empty, Row, Flex, Col, Space } from "antd"
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import './App.css'
import TextArea from 'antd/es/input/TextArea';

const { Header, Footer, Content } = Layout;

const headerStyle = {
  textAlign: 'center',
  backgroundColor: '#ffff',
}

const contentStyle = {
  textAlign: 'center',
  backgroundColor: '#ffff',
}

const footerStyle = {
  backgroundColor: '#ffff',
  textAlign: 'center',
}

const parseKmlGeofence = (text) => {
    const parser = new XMLParser();
    const jObj = parser.parse(text);
    const strCoordinates = jObj.kml.Document.Folder.Placemark[0].Polygon.outerBoundaryIs.LinearRing.coordinates
    const coordinates = strCoordinates.split(' ');
    const parsedCoordinates = new Array()
    coordinates.forEach(strCoordinate => {
        const parsed = strCoordinate.split(',').map(Number);
        parsedCoordinates.push([parsed[0], parsed[1]]);
    });

    return {
        geofence: [
            {
                geometry: {
                    type: "Polygon",
                    coordinates: parsedCoordinates
                }
            }
        ]
    }
}

const ParseGeofenceButton = ({ setGeofence }) => {
  const props = {
    name: 'file',
    accept: ".kml",
    showUploadList: false,
    beforeUpload(file){
        const reader = new FileReader();
        reader.onload = e => {
          try{
            const parsedGeofence = parseKmlGeofence(e.target.result);
            setGeofence(parsedGeofence);
            message.success(`Successfully parsed geofence`)
          } catch (error) {
            message.error(`Failed to parse geofence with error: ${error}`)
          }
        };
        reader.readAsText(file);
        return false;
    }
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to parse</Button>
    </Upload>
  )
}

const ResetParsedGeofenceButton = ({ setGeofence }) => {
  return <Button onClick={(e) => setGeofence(null)}>Reset</Button>
}

const FileDownloader = ({ blob, filename, onDownload }) => {
  const link = useRef(null)
  const url = URL.createObjectURL(blob)

  useEffect(() => {
    link.current.click()
    onDownload()

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [url, onDownload])

  return (
    <a style={{display: 'none'}} ref={link} href={url} download={filename}>
      Table export
    </a>
  )
}

const DownloadParsedGeofenceButton = ({ geofence }) => {
  const [download, setDownload] = useState(false)
  const handleDownload = (e) => setDownload(true)
  const onDownload = () => setDownload(false)

  return (
    <>
      <Button icon={<DownloadOutlined />} disabled={geofence === null} onClick={handleDownload}>Download</Button>
      {download && (<FileDownloader blob={new Blob([JSON.stringify(geofence, null, 2)], { type: "application/json" })} filename={"geofence.json"} onDownload={onDownload}/>)}
    </>
  )
}

const GeofenceView = ({ geofence, geofenceName }) => {
  let geofenceType = 'N.A'
  let numCoordinates = 0


  if (geofence !== null){
    geofenceType = geofence.geofence[0].geometry.type
    numCoordinates = geofence.geofence[0].geometry.coordinates.length
  }

  return (
    <>
      <Row>
        <Col span={12}>
          Geofence Type: {geofenceType}
        </Col>
        <Col span={12}>
          Number of Coordinates: {numCoordinates}
        </Col>
      </Row>
      <Row>
        <Col span={24}>{geofence === null ? <Empty/> : <TextArea value={JSON.stringify(geofence, null, 2)} autoSize={{ minRows: 10}}/>}</Col>
      </Row>
    </>
  )
}

const App = () => {
  const [geofence, setGeofence] = useState(null);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: '#ffff' }}>
      <Space direction='vertical' size={'middle'}>
        <Header style={headerStyle}>
          <Row>
            <Col span={24}>
              <h2>Dipul Geofence Parser</h2>
            </Col>
          </Row>
        </Header>
        <Content style={contentStyle}>
          <Flex gap="middle" vertical>
              <Row>
                <Col span={24}>
                  <Space direction='horizontal' size={'middle'}>
                    <ParseGeofenceButton setGeofence={setGeofence}/>
                    <DownloadParsedGeofenceButton geofence={geofence}/>
                    <ResetParsedGeofenceButton setGeofence={setGeofence}/>
                  </Space>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <GeofenceView geofence={geofence}/>
                </Col>
              </Row>
          </Flex>  
        </Content>
        <Footer style={footerStyle}>
          BestITUserEUW ©{new Date().getFullYear()}
        </Footer>
      </Space>
    </Layout>
  )
}

export default App
