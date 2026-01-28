'use client';

import React from 'react';
import { ThemeProvider } from '@/components/core/ThemeContext';
import { Slide } from '@/components/slide';
import { 
  Typography, 
  Alert, 
  List, 
  Card, 
  Statistic, 
  Steps,
  Row,
  Col,
  Progress,
  Tag,
} from '@/components/antd';
import { getTheme } from '@/themes';

const { Title, Paragraph, Text } = Typography;

// Demo data
const features = [
  { title: 'Feature 1', description: 'Description for feature 1' },
  { title: 'Feature 2', description: 'Description for feature 2' },
  { title: 'Feature 3', description: 'Description for feature 3' },
];

export default function DemoPage() {
  const theme = getTheme('teamsDark');
  
  return (
    <ThemeProvider theme={theme}>
      <div className="slide-container">
        <Slide layout="content">
          <Title>Ant Design Slide Demo</Title>
          <Paragraph type="secondary">
            This demonstrates our styled Ant Design components rendering in a slide format.
          </Paragraph>
          
          <Alert 
            type="info" 
            message="Important Update"
            description="Our components use Ant Design APIs but with slide-optimized styling."
            showIcon
          />
          
          <Row gutter={[24, 24]} style={{ marginTop: '1.5rem' }}>
            <Col span={8}>
              <Statistic 
                title="Users" 
                value={1128}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Growth" 
                value={93}
                suffix="%"
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Active" 
                value={2450}
              />
            </Col>
          </Row>
          
          <Steps
            direction="horizontal"
            current={1}
            items={[
              { title: 'Design', description: 'Create layouts' },
              { title: 'Develop', description: 'Build components' },
              { title: 'Deploy', description: 'Ship to production' },
            ]}
            style={{ marginTop: '1.5rem' }}
          />
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Tag>React</Tag>
            <Tag color="green">Ant Design</Tag>
            <Tag bordered={false}>TypeScript</Tag>
          </div>
        </Slide>
      </div>
    </ThemeProvider>
  );
}
