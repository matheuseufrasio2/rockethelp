import { useEffect, useState } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { HStack, ScrollView, Text, useTheme, VStack } from 'native-base';
import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { OrderFirestoreDTO } from '../dtos/OrderFirestoreDTO';
import { dateFormat } from '../utils/firestoreDateFormat';
import { Loading } from '../components/Loading';
import { CircleWavyCheck, Hourglass, DesktopTower, Clipboard } from 'phosphor-react-native';
import { CardDetails } from '../components/CardDetails';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Alert } from 'react-native';

type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [isLoadingCloseOrder, setIsLoadingCloseOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [solution, setSolution] = useState('');
  const [order, setOrder] = useState({} as OrderDetails);

  const { colors } = useTheme();
  const navigation = useNavigation();

  const route = useRoute();

  const { orderId } = route.params as RouteParams;

  function handleOrderClose() {
    if (!solution) {
      return Alert.alert('Solicitação', 'Informe a solução para encerrar a solicitação.')
    }

    setIsLoadingCloseOrder(true);
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .update({
        status: 'closed',
        solution,
        closed_at: firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        Alert.alert('Solicitação', 'Solicitação encerrada.');
        navigation.goBack();
      })
      .catch(error => {
        console.log(error)
        Alert.alert('Solicitação', 'Erro ao finalizar solicitação.')
      })
      .finally(() => setIsLoadingCloseOrder(false))
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then(doc => {
        const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

        const closed = closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          closed,
          when: dateFormat(created_at)
        });
        if (solution) setSolution(solution);
      })
      .finally(() => setIsLoading(false))
  }, []);

  return (
    <VStack flex={1} bg="gray.700">
      <Header title="Solicitação" />
      {isLoading ? <Loading /> : (
        <HStack bg="gray.500" justifyContent="center" p={4} >
          {order.status === 'closed'
            ? <CircleWavyCheck size={22} color={colors.green[300]} />
            : <Hourglass size={22} color={colors.secondary[700]} />
          }

          <Text
            fontSize="sm"
            color={order.status === 'closed' ? "green.300" : "secondary.700"}
            ml={2}
            textTransform="uppercase"
          >
            {order.status === 'closed' ? 'finalizado' : 'em andamento'}
          </Text>
        </HStack>
      )}
      {!isLoading && (
        <ScrollView mx={5} showsVerticalScrollIndicator={false}>
          <CardDetails
            title="Equipamento"
            description={`Patrimônio ${order.patrimony}`}
            icon={DesktopTower}
            footer={order.when}
          />

          <CardDetails
            title="Descrição do Problema"
            description={order.description}
            icon={Clipboard}
          />

          <CardDetails
            title="Solução"
            icon={CircleWavyCheck}
            footer={order.closed && `Encerrado em ${order.closed}`}
          >
            <Input
              placeholder="Descrição da solução"
              onChangeText={setSolution}
              value={solution}
              textAlignVertical="top"
              multiline
              h={24}
              isReadOnly={order.status === 'closed'}
              bg={order.status === 'closed' ? colors.gray[500] : colors.gray[700]}
            />
          </CardDetails>

          {
            order.status === 'open' &&
            <Button title="Encerrar solicitação" mt={5} onPress={handleOrderClose} isLoading={isLoadingCloseOrder}/>
          }
        </ScrollView>
      )}
    </VStack>
  );
}