import axios from 'axios';
import {
  Button,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  Flex,
  Form,
  FormGroup,
  MenuToggle,
  TextArea,
} from "@patternfly/react-core";

const FeedbackForm = ({ aiResponse, reportId }) => {
  // simple fields
  const [thumbs, setThumbs] = React.useState('');
  const [rating, setRating] = React.useState(null);
  const [comment, setComment] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [previousSubmission, setPreviousSubmission] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // dropdown states & toggles
  const dropdowns = [
    { key: 'assessment', label: 'Do you agree with the final assessment of the vulnerability?' },
    { key: 'reason',     label: 'Is the reason for classifying the CVE clear and well-supported?' },
    { key: 'summary',    label: 'Does the summary accurately capture the key findings and conclusions?' },
    { key: 'qClarity',   label: 'Were the checklist questions clear and understandable?' },
    { key: 'aAgreement', label: 'Do you agree with the answers provided for the checklist questions?' },
  ];

  const [values, setValues] = React.useState({
    assessment: 'Select an option',
    reason:     'Select an option',
    summary:    'Select an option',
    qClarity:   'Select an option',
    aAgreement: 'Select an option',
  });
  const [opens, setOpens] = React.useState({
    assessment: false,
    reason:     false,
    summary:    false,
    qClarity:   false,
    aAgreement: false,
  });

  const options = [
    'Yes, it is clear and well-supported.',
    'Mostly, but some critical aspects are missing.',
    'Partially, the evidence is weak or contradictory.',
    'No, it is incorrect or unsupported.',
  ];

  // load previous submission state
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`/feedback/${reportId}/exists`);
        if (data.exists) {
          setPreviousSubmission(true);
          setSubmitted(true);
        }
      } catch (e) {
        setError("Unable to check feedback status.");
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

  const handleSubmit = async () => {
    try {
      await axios.post("/feedback", {
        reportId,
        response: aiResponse,
        thumbs,
        rating,
        comment,
        ...values,
      });
      setSubmitted(true);
      setPreviousSubmission(false);
    } catch (e) {
      setError("Failed to submit feedback.");
    }
  };

  if (submitted) {
    return <p>
      {previousSubmission
        ? "Thank you! You already submitted feedback on this report."
        : "Thank you for your feedback!"}
    </p>;
  }

  return (
    <Form>
      {dropdowns.map(({ key, label }) => (
        <FormGroup key={key} label={label} fieldId={key}>
          <Dropdown
            isOpen={opens[key]}
            toggle={toggleRef => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setOpens(o => ({ ...o, [key]: !o[key] }))}
                isExpanded={opens[key]}
              >
                {values[key]}
              </MenuToggle>
            )}
            onOpenChange={open => setOpens(o => ({ ...o, [key]: open }))}
            shouldFocusToggleOnSelect
          >
            <DropdownGroup>
              <DropdownList>
                {options.map(opt => (
                  <DropdownItem
                    key={opt}
                    onClick={() => {
                      setValues(v => ({ ...v, [key]: opt }));
                      setOpens(o => ({ ...o, [key]: false }));
                    }}
                  >
                    {opt}
                  </DropdownItem>
                ))}
              </DropdownList>
            </DropdownGroup>
          </Dropdown>
        </FormGroup>
      ))}

      <FormGroup label="Do you like this response?" fieldId="thumbs">
        <Button
          variant={thumbs === '👍' ? 'primary' : 'secondary'}
          onClick={() => setThumbs('👍')}
        >👍</Button>{' '}
        <Button
          variant={thumbs === '👎' ? 'primary' : 'secondary'}
          onClick={() => setThumbs('👎')}
        >👎</Button>
      </FormGroup>

      <FormGroup label="Rate the response (1-5):" fieldId="rating">
        <Flex spaceItems={{ default: 'spaceItemsMd' }}>
          {[1,2,3,4,5].map(n => (
            <label key={n}>
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                style={{ marginRight: '0.25rem' }}
              />{n}
            </label>
          ))}
        </Flex>
      </FormGroup>

      <FormGroup label="Additional Comments" fieldId="comment">
        <TextArea
          value={comment}
          onChange={(_e, val) => setComment(val)}
          id="comment"
        />
      </FormGroup>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isInline
        >Submit Feedback</Button>
      </Flex>
    </Form>
  );
};

export default FeedbackForm;