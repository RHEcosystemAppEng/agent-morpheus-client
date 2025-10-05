/** @typedef {import('../types').Vuln} Vuln */
import { useEffect, useState } from "react";
import { Card, CardTitle, CardBody, Title, Accordion, AccordionItem, AccordionToggle, AccordionContent } from "@patternfly/react-core";

/**
 * @param {{ vuln: Vuln }} props
 */
export default function ChecklistCard({ vuln }) {
  const [expandedByKey, setExpandedByKey] = useState({});

  // Expand all items by default and whenever `vulns` changes
  useEffect(() => {
    if (!vuln || !Array.isArray(vuln.checklist)) {
      setExpandedByKey({});
      return;
    }
    const allKeys = {};
    vuln.checklist.forEach((_item, i_idx) => {
      allKeys[`${i_idx}`] = true;
    });
    setExpandedByKey(allKeys);
  }, [vuln]);

  const toggleKey = (key) => {
    setExpandedByKey(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Card>
      <CardTitle><Title headingLevel="h4" size="xl">Analysis Q&A</Title></CardTitle>
      <CardBody>
        {Array.isArray(vuln?.checklist) && vuln.checklist.length > 0 ? (
          <Accordion asDefinitionList aria-label="Analysis checklist">
            {vuln.checklist.map((item, i_idx) => {
              const key = `${i_idx}`;
              const isExpanded = !!expandedByKey[key];
              return (
                <AccordionItem key={key} isExpanded={isExpanded}>
                  <AccordionToggle id={`toggle_${key}`} onClick={() => toggleKey(key)}>
                    <span
                      style={
                        isExpanded
                          ? {
                              whiteSpace: 'normal',
                              overflow: 'visible',
                              textOverflow: 'clip',
                              wordBreak: 'break-word'
                            }
                          : {
                              display: 'inline-block',
                              maxWidth: '100%',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                      }
                    >
                      {item.input}
                    </span>
                  </AccordionToggle>
                  <AccordionContent id={`content_${key}`}>
                    <p>
                      {item.response}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : null}
      </CardBody>
    </Card>
  );
} 