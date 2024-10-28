import React, { useEffect, useState } from 'react';
import { Button, Input, message, Row, Space, Table, Upload } from 'antd';
import axios from 'axios';

const column = [
  {
    title: "中文",
    dataIndex: "zh",
  },
  {
    title: "英文",
    dataIndex: "en",
  },
  {
    title: "俄文",
    dataIndex: "ru",
  },
];

const App: React.FC = () => {
  const [dataSource, setDataSource] = useState<Array<any>>([]);
  console.log('1111111111', dataSource);
  

  useEffect(() => {
    init();
  }, [])

  const init = async () => {
    const result = await axios.get("http://127.0.0.1:8888/language/list");
    setDataSource(result?.data?.data || []);
  }

  const fanyiFn = (params: {
    text: string;
    language: string;
  }, index: number) => {
    if(!params || !Object.keys(params).length) return;

    const { text, language, } = params;
    if(!text) return;
 
    axios.post("http://127.0.0.1:8888/fanyi", {...params}).then(res => {
      const { content, error_code, error_msg, } = res?.data || {};
      if(error_code && error_msg) {
        return message.error(error_msg);
      }
  
      setDataSource((prevState) => {
        const data = JSON.parse(JSON.stringify(prevState))
        Object.assign(data[index], {
          [language]: content || "",
        })
        return data;
      })
    })
  }

  return (
    <div style={{ padding: "20px", }}>
      <Table
        dataSource={ dataSource }
        bordered
        rowKey="languageId"
        title={() => {
          return (
            <Space>
              <Button 
                type="primary"
                onClick={() => {
                  setDataSource(item => {
                    const item_new = column.reduce((res, item02) => {
                      Object.assign(res, {
                        [item02?.dataIndex]: null,
                      })

                      return res;
                    }, {})
                    return [...item, {
                      languageId: `${ Date.now() }`,
                      ...item_new,
                    }];
                  })
                }}
              >添加行</Button>

              {
                column.map(item => {
                  const key = item?.dataIndex;
                  return (
                    <Upload
                      key={ key }
                      accept=".json"
                      maxCount={ 1 }
                      iconRender={() => null}
                      beforeUpload={(file) => {
                        const reader = new FileReader();
                        reader.addEventListener('load', (e) => {
                          const text = e?.target?.result || "{}";
                          const result = JSON.parse(String(text)) || {};

                          const data = JSON.parse(JSON.stringify(dataSource)) as Array<any>;

                          Object.entries(result).forEach(([k, v], index02) => {
                            const content = data.find(item02 => item02?.zh === k) || {};
                            if(content && Object.keys(content).length) {
                              Object.assign(content, {
                                [key]: v || null,
                              })
                            }else {
                              if(key === 'zh') {
                                data.push({
                                  languageId: `${ Date.now() + index02 }`,
                                  zh: k || null,
                                });
                              }else {
                                data.push({
                                  languageId: `${ Date.now() + index02 }`,
                                  zh: k || null,
                                  [key]: v || null,
                                });
                              }
                            }
                          })
      
                          setDataSource(data);
                        });
                        reader.readAsText(file);
                    
                        return false;
                      }}
                    >
                      <Button 
                        type="primary"
                      >导入{ item?.title }json</Button>
                    </Upload>
                  );
                })
              }
            </Space>
          );
        }}
        footer={() => {
          return (
            <Space>
              <Button 
                type="primary"
                onClick={() => {
                  axios.post(`http://127.0.0.1:8888/language/add`, {
                    list: dataSource,
                  });
                }}
              >全部保存</Button>

              {
                column.map(item => {
                  const key = item?.dataIndex;
                  return (
                    <Button 
                      key={ key }
                      type="primary"
                      onClick={() => {
                        axios.post(`http://127.0.0.1:8888/language/add`, {
                          list: dataSource,
                        }).then(() => {
                          axios.get(`http://127.0.0.1:8888/language/export/${ key }`, { responseType: 'blob' }).then(res => {
                            const url = window.URL.createObjectURL(res.data);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${ key }.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          });
                        });
                      }}
                    >保存并导出{ item?.title }json</Button>
                  );
                })
              }
            </Space>
          );
        }}
      >
        <Table.Column 
          title="序号" 
          dataIndex="index" 
          key="index" 
          width="80px"
          align='center'
          render={(text, record, index) => `${ index + 1 }`}
        />

        {
          column.map(item => {
            const key = item?.dataIndex;
            return (
              <Table.Column 
                key={ key }
                {...item}
                title={<Space>
                  <span>{ item?.title }</span>
                </Space>}
                render={(text, row, index) => {
                  return <Row align="middle">
                    <Input.TextArea 
                      value={ text } 
                      style={{ flex: 1, }}
                      placeholder={ `请输入${ item?.title }` }
                      onChange={(e) => {
                        const data = JSON.parse(JSON.stringify(dataSource)) as Array<any>;
                        const content = data.find(item02 => item02?.languageId === row?.languageId) || {};
                        if(content && Object.keys(content).length) {
                          Object.assign(content, {
                            [key]: e?.target?.value || null,
                          })
                        }
                        setDataSource(data);
                        
                      }}
                    />
      
                    {
                      !["zh"].includes(key) ? (
                        <Button
                          type="primary"
                          onClick={() => fanyiFn({
                            text: row?.zh,
                            language: key,
                          }, index)}
                          style={{ marginLeft: "16px", }}
                        >翻译</Button>
                      ) : null
                    }
                  </Row>
                }}
              />
            );
          })
        }
        
        <Table.Column 
          title="操作" 
          width="100px"
          render={(row) => {
            return (
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    axios.post(`http://127.0.0.1:8888/language/update`, {...row});
                  }}
                >保存</Button>

                <Button
                  onClick={() => {
                    setDataSource((list) => {
                      const result = list.filter(item => item?.languageId !== row?.languageId);
                      return result;
                    })
                    axios.post(`http://127.0.0.1:8888/language/delete`, { languageId: row?.languageId, });
                    
                  }}
                >删除</Button>
              </Space>
            );
          }}
        />
      </Table>
    </div>
  );
};

export default App;