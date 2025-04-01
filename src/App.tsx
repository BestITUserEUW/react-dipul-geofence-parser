import React from 'react';
import {useState} from 'react';
import {XMLParser} from 'fast-xml-parser';
import {Layout, Upload, Button, message, Empty, Row, Flex, Col, Space, Divider} from 'antd';
import type {UploadProps} from 'antd';
import {UploadOutlined, DownloadOutlined} from '@ant-design/icons';
import './App.css';
import TextArea from 'antd/es/input/TextArea';

const {Header, Footer, Content} = Layout;

interface GeofenceCtx {
  serialized: string;
  type: string;
  numCoordinates: number;
}

type Maybe<T> = T | null;
type UpdateGeofenceFn = (kmlGeofence: string) => void;

const parseKmlGeofence = (text: string) => {
  const parser = new XMLParser();
  const jObj = parser.parse(text);
  const strCoordinates: string = jObj.kml.Document.Folder.Placemark[0].Polygon.outerBoundaryIs.LinearRing.coordinates;
  const coordinates = strCoordinates.split(' ');
  const parsedCoordinates = new Array();
  coordinates.forEach((strCoordinate) => {
    const parsed = strCoordinate.split(',').map(Number);
    parsedCoordinates.push([parsed[0], parsed[1]]);
  });

  return {
    geofence: [
      {
        geometry: {
          type: 'Polygon',
          coordinates: parsedCoordinates,
        },
        inclusion: true,
      },
    ],
  };
};

const ParseGeofenceButton: React.FC<{updateGeofence: UpdateGeofenceFn}> = ({updateGeofence}) => {
  const props: UploadProps = {
    name: 'file',
    accept: '.kml',
    showUploadList: false,
    beforeUpload(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result === null) {
          message.error('Reader result is null');
          return;
        }

        updateGeofence(e.target!.result as string);
        message.success(`Successfully parsed geofence`);
      };
      reader.readAsText(file);
      return false;
    },
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to parse</Button>
    </Upload>
  );
};

interface GeofenceViewProps {
  geofence: GeofenceCtx;
}

const GeofenceView: React.FC<GeofenceViewProps> = ({geofence}) => {
  return (
    <>
      <Row>
        <Col span={4}>Geofence Type: {geofence.type}</Col>
      </Row>
      <Row>
        <Col span={4}>Number of Coordinates: {geofence.numCoordinates}</Col>
      </Row>
      <Row>
        <Col span={24}>{<TextArea value={geofence.serialized} autoSize={{minRows: 10}} />}</Col>
      </Row>
    </>
  );
};

const App: React.FC = () => {
  const [geofence, setGeofence] = useState<Maybe<GeofenceCtx>>(null);
  const [downloadUrl, setDownloadUrl] = useState<Maybe<string>>(null);

  const updateGeofence = (kmlGeofence: string) => {
    const parsedGeofence = parseKmlGeofence(kmlGeofence);
    const type = parsedGeofence.geofence[0].geometry.type;
    const numCoordinates = parsedGeofence.geofence[0].geometry.coordinates.length;
    const serialized = JSON.stringify(parsedGeofence, null, 2);
    setGeofence({serialized, type, numCoordinates});
    setDownloadUrl(URL.createObjectURL(new Blob([JSON.stringify(parsedGeofence, null, 0)], {type: 'application/json'})));
  };

  const resetGeofence = () => {
    setGeofence(null);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  };

  return (
    <Layout style={{minHeight: '100vh', backgroundColor: '#ffff'}}>
      <Header style={{textAlign: 'center', backgroundColor: '#ffff'}}>
        <Row>
          <Col span={24}>
            <h2>Dipul Geofence Parser</h2>
          </Col>
        </Row>
      </Header>
      <Divider />
      <Content style={{textAlign: 'center', backgroundColor: '#ffff'}}>
        <Flex gap="middle" vertical>
          <Row>
            <Col span={24}>
              <Space direction="horizontal" size={'middle'}>
                <ParseGeofenceButton updateGeofence={updateGeofence} />
                <Button onClick={resetGeofence}>Reset</Button>
                {downloadUrl && (
                  <a href={downloadUrl} download="geofence.json">
                    <Button type="primary" icon={<DownloadOutlined />}>
                      Download
                    </Button>
                  </a>
                )}
              </Space>
            </Col>
          </Row>
          <Row>
            <Col span={24}>{geofence === null ? <Empty /> : <GeofenceView geofence={geofence} />}</Col>
          </Row>
        </Flex>
      </Content>
      <Footer style={{backgroundColor: '#ffff', textAlign: 'center'}}>BestITUserEUW ©{new Date().getFullYear()}</Footer>
    </Layout>
  );
};

export default App;
